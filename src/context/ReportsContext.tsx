import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  CommunityPost,
  IncidentCategory,
  IncidentReport,
  ReportVerificationStatus,
  RiskZone,
  SafeHaven,
} from '../types/safety';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_INCIDENT_REPORTS,
  INITIAL_RISK_ZONES,
  INITIAL_SAFE_HAVENS,
} from '../data/mockSafetyData';
import { calculateDynamicZoneScore } from '../utils/safetyRiskEngine';
import { canSubmitWithSpamCooldown } from '../utils/validation';
import {
  addSafetyReportCommentDoc,
  createCommunityPostDoc,
  createSafetyReportDoc,
  fetchSafetyReports,
  incrementReportCounterDoc,
  recordReportAbuseFlagDoc,
  recordReportCorroborationDoc,
} from '../services/firebaseClient';
import { useAuth } from './AuthContext';

export interface ReportsContextType {
  timeHour: number;
  setTimeHour: (h: number) => void;
  zones: RiskZone[];
  selectedZone: RiskZone | null;
  setSelectedZone: (z: RiskZone | null) => void;
  reports: IncidentReport[];
  setReports: React.Dispatch<React.SetStateAction<IncidentReport[]>>;
  categoryFilter: IncidentCategory | 'all';
  setCategoryFilter: (cat: IncidentCategory | 'all') => void;
  submitSafetyReport: (input: {
    category: IncidentCategory;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    severity: 1 | 2 | 3 | 4 | 5;
  }) => Promise<{ ok: boolean; error?: string }>;
  corroborateReport: (reportId: string) => Promise<void>;
  flagReport: (reportId: string, kind: 'outdated' | 'abuse') => Promise<void>;
  addReportComment: (reportId: string, body: string) => Promise<{ ok: boolean; error?: string }>;
  safeHavens: SafeHaven[];
  communityPosts: CommunityPost[];
  blockedAuthorUids: string[];
  createCommunityPost: (input: {
    coarseArea: string;
    topic: CommunityPost['topic'];
    body: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  addCommunityPostComment: (postId: string, body: string) => void;
  markPostHelpful: (postId: string) => void;
  flagOrBlockCommunityPost: (postId: string, authorUid: string, blockAuthor: boolean) => void;
}

export const ReportsContext = createContext<ReportsContextType | null>(null);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setStatusBanner } = useAuth();

  const [timeHour, setTimeHour] = useState<number>(21);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_INCIDENT_REPORTS);
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(INITIAL_RISK_ZONES[0]);
  const [safeHavens] = useState<SafeHaven[]>(INITIAL_SAFE_HAVENS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [blockedAuthorUids, setBlockedAuthorUids] = useState<string[]>([]);

  const lastPostTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    fetchSafetyReports()
      .then((remoteReports) => {
        if (remoteReports.length > 0) {
          setReports((prev) => {
            const syntheticSeed = prev.filter((r) => r.isSynthetic);
            return [...remoteReports, ...syntheticSeed];
          });
        }
      })
      .catch((err) => console.warn('[ReportsContext] fetchSafetyReports error:', err));
  }, []);

  const zones: RiskZone[] = useMemo(() => {
    return INITIAL_RISK_ZONES.map((zone) => {
      const nearbyCount = reports.filter(
        (r) =>
          Math.abs(r.latitude - zone.center[0]) < 0.005 &&
          Math.abs(r.longitude - zone.center[1]) < 0.005
      ).length;
      const calc = calculateDynamicZoneScore(
        zone.safetyScore,
        timeHour,
        zone.lightingRating,
        zone.cctvCoverage,
        nearbyCount
      );
      return {
        ...zone,
        safetyScore: calc.score,
        level: calc.level,
      };
    });
  }, [reports, timeHour]);

  const submitSafetyReport: ReportsContextType['submitSafetyReport'] = async (input) => {
    const cooldown = canSubmitWithSpamCooldown(lastPostTimestampRef.current, Date.now(), 10_000);
    if (!cooldown.allowed) {
      return { ok: false, error: `Please wait ${cooldown.waitSeconds}s before submitting another report.` };
    }
    const id = `rep-${Date.now()}`;
    const newReport: IncidentReport = {
      id,
      authorUid: user.uid,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      timestamp: new Date().toISOString(),
      timeHour: new Date().getHours(),
      lightingCondition: 'dim',
      severity: input.severity,
      verificationStatus: 'unverified',
      corroborationCount: 0,
      outdatedFlags: 0,
      abuseFlags: 0,
      isSynthetic: !user.isAuthenticated,
      comments: [],
    };
    setReports((prev) => [newReport, ...prev]);
    lastPostTimestampRef.current = Date.now();

    if (user.isAuthenticated) {
      try {
        await createSafetyReportDoc(newReport, user.uid);
      } catch (err) {
        console.error('Firestore report write failed:', err);
        setReports((prev) => prev.filter((r) => r.id !== id));
        const errorMessage = err instanceof Error ? err.message : 'Failed to publish incident report to cloud database.';
        return { ok: false, error: errorMessage };
      }
    }
    return { ok: true };
  };

  const corroborateReport = async (reportId: string) => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;
    if (target.authorUid === user.uid) {
      Alert.alert('Cannot Self-Corroborate', 'You cannot corroborate an incident report that you authored.');
      return;
    }

    const nextCount = target.corroborationCount + 1;
    const nextStatus: ReportVerificationStatus =
      target.verificationStatus === 'authorized_verified'
        ? 'authorized_verified'
        : nextCount >= 3
        ? 'community_corroborated'
        : 'under_review';

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, corroborationCount: nextCount, verificationStatus: nextStatus }
          : r
      )
    );

    if (user.isAuthenticated) {
      try {
        await recordReportCorroborationDoc(reportId, user.uid);
      } catch (err) {
        console.warn('Corroborate update skipped:', err);
      }
    }
  };

  const flagReport = async (reportId: string, kind: 'outdated' | 'abuse') => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;
    const nextCount = (kind === 'outdated' ? target.outdatedFlags : target.abuseFlags) + 1;

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? kind === 'outdated'
            ? { ...r, outdatedFlags: nextCount }
            : { ...r, abuseFlags: nextCount }
          : r
      )
    );

    if (user.isAuthenticated) {
      try {
        if (kind === 'abuse') {
          await recordReportAbuseFlagDoc(reportId, user.uid);
        } else {
          await incrementReportCounterDoc(reportId, 'outdatedFlags', nextCount);
        }
      } catch (err) {
        console.warn('Flag update skipped:', err);
      }
    }
  };

  const addReportComment: ReportsContextType['addReportComment'] = async (reportId, body) => {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      return { ok: false, error: 'Comment must be at least 2 characters.' };
    }
    const comment = {
      id: `cmt-${Date.now()}`,
      reportId,
      authorUid: user.uid,
      authorDisplay: user.displayName || 'Community Member',
      body: trimmed,
      flaggedAbuse: false,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, comments: [...(r.comments || []), comment] } : r))
    );
    if (user.isAuthenticated) {
      try {
        await addSafetyReportCommentDoc(comment);
      } catch (err) {
        console.warn('Comment write skipped:', err);
      }
    }
    return { ok: true };
  };

  const createCommunityPost: ReportsContextType['createCommunityPost'] = async (input) => {
    const cooldown = canSubmitWithSpamCooldown(lastPostTimestampRef.current, Date.now(), 10_000);
    if (!cooldown.allowed) {
      return { ok: false, error: `Please wait ${cooldown.waitSeconds}s before posting again.` };
    }
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorUid: user.uid,
      authorDisplay: user.displayName || 'Community Member',
      coarseArea: input.coarseArea.trim(),
      topic: input.topic,
      body: input.body.trim(),
      helpfulCount: 0,
      abuseFlags: 0,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    setCommunityPosts((prev) => [post, ...prev]);
    lastPostTimestampRef.current = Date.now();
    if (user.isAuthenticated) {
      try {
        await createCommunityPostDoc(post);
      } catch {}
    }
    return { ok: true };
  };

  const addCommunityPostComment = (postId: string, body: string) => {
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `pc-${Date.now()}`,
                  authorDisplay: user.displayName || 'Member',
                  body: trimmed,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      )
    );
  };

  const markPostHelpful = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, helpfulCount: p.helpfulCount + 1 } : p))
    );
  };

  const flagOrBlockCommunityPost = (postId: string, authorUid: string, blockAuthor: boolean) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, abuseFlags: p.abuseFlags + 1 } : p))
    );
    if (blockAuthor) {
      setBlockedAuthorUids((prev) => [...new Set([...prev, authorUid])]);
      setStatusBanner('Author blocked from your Safety Community feed.');
    } else {
      setStatusBanner('Post flagged for community moderation review.');
    }
  };

  return (
    <ReportsContext.Provider
      value={{
        timeHour,
        setTimeHour,
        zones,
        selectedZone,
        setSelectedZone,
        reports,
        setReports,
        categoryFilter,
        setCategoryFilter,
        submitSafetyReport,
        corroborateReport,
        flagReport,
        addReportComment,
        safeHavens,
        communityPosts,
        blockedAuthorUids,
        createCommunityPost,
        addCommunityPostComment,
        markPostHelpful,
        flagOrBlockCommunityPost,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export function useReports(): ReportsContextType {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
