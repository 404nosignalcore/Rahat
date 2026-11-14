import React, { useEffect, useRef } from 'react';
import { IncidentReport, RiskZone, RouteOption, SafeHaven } from '../../types/safety';
import { SafetyMapView as SafetyMapViewNative } from './SafetyMapView.native';

export interface SafetyMapViewProps {
  height?: number;
  zones?: RiskZone[];
  reports?: IncidentReport[];
  safeHavens?: SafeHaven[];
  routes?: RouteOption[];
  selectedRouteId?: string;
  userLocation?: { lat: number; lng: number };
  onSelectZone?: (zone: RiskZone) => void;
  onSelectReport?: (report: IncidentReport) => void;
  onPickCoordinate?: (lat: number, lng: number) => void;
  pickMode?: boolean;
}

const RISK_HEX = {
  safe: { stroke: '#15803D', fill: '#22C55E' },
  caution: { stroke: '#B45309', fill: '#F59E0B' },
  danger: { stroke: '#DC2626', fill: '#EF4444' },
};

export const SafetyMapView: React.FC<SafetyMapViewProps> = (props) => {
  const {
    height = 280,
    zones = [],
    reports = [],
    safeHavens = [],
    routes = [],
    selectedRouteId,
    userLocation,
    onSelectZone,
    onSelectReport,
    onPickCoordinate,
    pickMode = false,
  } = props;

  const L = typeof window !== 'undefined' ? (window as any).L : null;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [28.6295, 77.224],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, [L]);

  useEffect(() => {
    if (!L) return;
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: any) => {
      if (pickMode && onPickCoordinate) {
        onPickCoordinate(e.latlng.lat, e.latlng.lng);
      }
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [L, pickMode, onPickCoordinate]);

  useEffect(() => {
    if (!L) return;
    const group = layerGroupRef.current;
    const map = mapRef.current;
    if (!group || !map) return;

    group.clearLayers();

    zones.forEach((zone) => {
      const palette = RISK_HEX[zone.level];
      const poly = L.polygon(zone.coordinates, {
        color: palette.stroke,
        fillColor: palette.fill,
        fillOpacity: 0.22,
        weight: 2,
      });
      poly.bindTooltip(`${zone.name} · Score ${zone.safetyScore}/100`);
      poly.on('click', () => onSelectZone?.(zone));
      poly.addTo(group);
    });

    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const line = L.polyline(route.path, {
        color: route.isRecommended ? '#15803D' : '#B45309',
        weight: isSelected ? 6 : 3,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: route.isRecommended ? undefined : '6, 8',
      });
      line.bindTooltip(`${route.name} (${route.durationMins} min)`);
      line.addTo(group);
    });

    reports.forEach((rep) => {
      const marker = L.circleMarker([rep.latitude, rep.longitude], {
        radius: 8,
        color: '#FFFFFF',
        weight: 2,
        fillColor: rep.severity >= 4 ? '#DC2626' : '#F59E0B',
        fillOpacity: 0.92,
      });
      marker.bindTooltip(`${rep.title} (${rep.verificationStatus})`);
      marker.on('click', () => onSelectReport?.(rep));
      marker.addTo(group);
    });

    safeHavens.forEach((haven) => {
      const marker = L.circleMarker([haven.latitude, haven.longitude], {
        radius: 7,
        color: '#FFFFFF',
        weight: 2,
        fillColor: '#6D5BD0',
        fillOpacity: 0.95,
      });
      marker.bindTooltip(
        `${haven.name} (${haven.sourceTier === 'verified' ? 'Verified' : 'Community'})`
      );
      marker.addTo(group);
    });

    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#2563EB',
        fillOpacity: 1,
      })
        .bindTooltip('Your Current Location')
        .addTo(group);
    }

    const timer = window.setTimeout(() => {
      if (mapRef.current === map && containerRef.current?.isConnected) {
        map.invalidateSize();
      }
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [L, zones, reports, safeHavens, routes, selectedRouteId, userLocation]);

  if (!L) {
    return <SafetyMapViewNative {...props} />;
  }

  return (
    <div
      data-testid="safety-map-canvas"
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(100, 116, 139, 0.22)',
        position: 'relative',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
