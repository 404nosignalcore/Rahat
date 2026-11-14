import { AppLanguage, IncidentCategory, ReportVerificationStatus, SafeHavenType } from '../types/safety';

export const translations = {
  en: {
    brand: 'RAHAT · राहत',
    missionQuote: 'A step towards freedom. A movement towards safety.',
    tabs: {
      safezone: 'SafeZone',
      route: 'Route',
      sos: 'SOS',
      connect: 'Connect',
      profile: 'Profile',
    },
    topBar: {
      safeHeroes: 'SafeHeroes',
      signIn: 'Sign In',
    },
    disclaimers: {
      zoneNotice: 'Zones reflect community reports and lighting factors—not official crime predictions. Absence of reports does not guarantee safety.',
      demoBadge: 'Demo Data',
      liveBadge: 'Cloud Synced',
    },
    verification: {
      unverified: 'Unverified',
      under_review: 'Under review',
      community_corroborated: 'Community corroborated',
      authorized_verified: 'Verified by an authorized source',
    } as Record<ReportVerificationStatus, string>,
    categories: {
      harassment: 'Harassment',
      stalking: 'Stalking / Following',
      verbal_abuse: 'Verbal Abuse',
      physical_assault: 'Physical Assault',
      poor_lighting: 'Poor Lighting',
      secluded_area: 'Secluded Area',
      unsafe_transport: 'Unsafe Transport',
      suspicious_activity: 'Suspicious Activity',
    } as Record<IncidentCategory, string>,
    safeHavenTypes: {
      police: 'Police Station',
      hospital: 'Hospital',
      pharmacy: '24/7 Pharmacy',
      verified_shop: 'Safe Space Shop',
      campus_security: 'Security Post',
      metro_booth: 'Metro Helpdesk',
    } as Record<SafeHavenType, string>,
    deviation: {
      title: 'Route Deviation Detected',
      subtitle: 'You appear significantly off your planned route. Choose how you want to respond:',
      imSafe: "I'm Safe",
      recalculate: 'Recalculate Route',
      shareLocation: 'Share My Location',
      activateSos: 'Activate SOS',
    },
  },
  hi: {
    brand: 'राहत · RAHAT',
    missionQuote: 'आज़ादी की ओर एक कदम। सुरक्षा की ओर एक आंदोलन।',
    tabs: {
      safezone: 'सेफज़ोन',
      route: 'मार्ग',
      sos: 'SOS',
      connect: 'कनेक्ट',
      profile: 'प्रोफ़ाइल',
    },
    topBar: {
      safeHeroes: 'सेफहीरोज़',
      signIn: 'साइन इन',
    },
    disclaimers: {
      zoneNotice: 'ज़ोन सामुदायिक रिपोर्ट व रोशनी कारक दिखाते हैं—आधिकारिक अपराध भविष्यवाणी नहीं। रिपोर्ट न होने का अर्थ पूर्ण सुरक्षा नहीं है।',
      demoBadge: 'डेमो डेटा',
      liveBadge: 'क्लाउड सिंक्ड',
    },
    verification: {
      unverified: 'असत्यापित',
      under_review: 'समीक्षाधीन',
      community_corroborated: 'समुदाय द्वारा पुष्ट',
      authorized_verified: 'अधिकृत स्रोत द्वारा सत्यापित',
    } as Record<ReportVerificationStatus, string>,
    categories: {
      harassment: 'छेड़छाड़',
      stalking: 'पीछा करना',
      verbal_abuse: 'अभद्र भाषा',
      physical_assault: 'शारीरिक हमला',
      poor_lighting: 'कम रोशनी',
      secluded_area: 'सुनसान क्षेत्र',
      unsafe_transport: 'असुरक्षित परिवहन',
      suspicious_activity: 'संदिग्ध गतिविधि',
    } as Record<IncidentCategory, string>,
    safeHavenTypes: {
      police: 'पुलिस स्टेशन',
      hospital: 'अस्पताल',
      pharmacy: '24/7 फार्मेसी',
      verified_shop: 'सुरक्षित दुकान',
      campus_security: 'सुरक्षा चौकी',
      metro_booth: 'मेट्रो हेल्पडेस्क',
    } as Record<SafeHavenType, string>,
    deviation: {
      title: 'मार्ग विचलन चेतावनी',
      subtitle: 'आप अपने तय मार्ग से काफी दूर प्रतीत होते हैं। कृपया अपनी प्रतिक्रिया चुनें:',
      imSafe: 'मैं सुरक्षित हूँ',
      recalculate: 'नया मार्ग खोजें',
      shareLocation: 'मेरी लोकेशन साझा करें',
      activateSos: 'SOS सक्रिय करें',
    },
  },
};

export function getTranslation(lang: AppLanguage) {
  return translations[lang] || translations.en;
}
