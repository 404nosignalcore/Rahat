import React, { useEffect, useRef, useState } from 'react';
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
  onSelectRoute?: (route: RouteOption) => void;
  onPickCoordinate?: (lat: number, lng: number) => void;
  pickMode?: boolean;
}

const RISK_HEX = {
  safe: { stroke: '#34c759', fill: '#34c759' },
  caution: { stroke: '#ff9500', fill: '#ff9500' },
  danger: { stroke: '#ff3b30', fill: '#ff3b30' },
};

export type GoogleMapType = 'roadmap' | 'satellite' | 'terrain';

const GOOGLE_MAP_LYRS: Record<GoogleMapType, string> = {
  roadmap: 'm',
  satellite: 'y',
  terrain: 'p',
};

export const SafetyMapView: React.FC<SafetyMapViewProps> = (props) => {
  const {
    height = 360,
    zones = [],
    reports = [],
    safeHavens = [],
    routes = [],
    selectedRouteId,
    userLocation = { lat: 28.6295, lng: 77.224 },
    onSelectZone,
    onSelectReport,
    onSelectRoute,
    onPickCoordinate,
    pickMode = false,
  } = props;

  const [leafletReady, setLeafletReady] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean((window as any).L);
  });
  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [mapType, setMapType] = useState<GoogleMapType>('roadmap');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Dynamic injection of Leaflet CSS & JS if not present
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setLeafletReady(true);
      return;
    }

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    let script = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletReady(true);
      };
      script.onerror = () => {
        console.warn('Leaflet script CDN unavailable; using enhanced vector preview.');
      };
      document.body.appendChild(script);
    } else {
      const handleLoad = () => setLeafletReady(true);
      script.addEventListener('load', handleLoad);
      return () => {
        script?.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  // Map Initialization
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    if (!L || !leafletReady || !containerRef.current || mapRef.current) return;

    const initialCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [28.6295, 77.224];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 15,
      minZoom: 11,
      maxZoom: 19,
      zoomControl: false, // Custom Apple pill zoom controls
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    // Official Google Maps Tile Layer
    const lyrs = GOOGLE_MAP_LYRS[mapType];
    const googleTileLayer = L.tileLayer(
      `https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`,
      {
        attribution: '&copy; Google Maps',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
      }
    ).addTo(map);
    tileLayerRef.current = googleTileLayer;

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, [leafletReady]);

  // Dynamic Google Maps Layer Switcher (Roadmap, Satellite Hybrid, Terrain)
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    const map = mapRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const lyrs = GOOGLE_MAP_LYRS[mapType];
    const newGoogleLayer = L.tileLayer(
      `https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`,
      {
        attribution: '&copy; Google Maps',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
      }
    ).addTo(map);

    // Keep base tiles underneath markers and polygons
    newGoogleLayer.bringToBack();
    tileLayerRef.current = newGoogleLayer;
  }, [mapType]);

  // Click & Coordinate Picker Listener
  useEffect(() => {
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
  }, [pickMode, onPickCoordinate]);

  // Layer Update (Zones, Routes, Reports, Havens, Beacon)
  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    const group = layerGroupRef.current;
    const map = mapRef.current;
    if (!L || !group || !map) return;

    group.clearLayers();

    // 1. Safety Zones (Corridors & Areas)
    zones.forEach((zone) => {
      const palette = RISK_HEX[zone.level] || RISK_HEX.safe;
      const poly = L.polygon(zone.coordinates, {
        color: palette.stroke,
        fillColor: palette.fill,
        fillOpacity: 0.22,
        weight: 2,
        dashArray: zone.level === 'danger' ? '4, 6' : undefined,
      });

      poly.bindTooltip(
        `<div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600; padding: 2px 4px;">
          ${zone.name}<br/>
          <span style="font-weight: 400; color: #555;">Safety Score: ${zone.safetyScore}/100 · ${zone.level.toUpperCase()}</span>
        </div>`,
        { sticky: true }
      );

      poly.on('click', () => onSelectZone?.(zone));
      poly.addTo(group);
    });

    // 2. Monitored Routes
    routes.forEach((route) => {
      const isSelected = route.id === selectedRouteId;
      const lineColor = route.isRecommended ? '#34c759' : '#0066cc';

      const line = L.polyline(route.path, {
        color: lineColor,
        weight: isSelected ? 6 : 3.5,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: route.isRecommended ? undefined : '6, 8',
      });

      line.bindTooltip(
        `<div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600;">
          ${route.name} (${route.durationMins} min) · ${route.safetyScore}/100 Safe
          ${isSelected ? '<br/><span style="color: #0066cc; font-size: 11px;">Active Comparison Target</span>' : ''}
        </div>`
      );

      line.on('click', () => {
        onSelectRoute?.(route);
      });

      line.addTo(group);
    });

    // Auto-fit selected route bounds if available
    const activeRoute = routes.find((r) => r.id === selectedRouteId);
    if (activeRoute && activeRoute.path.length > 1) {
      try {
        const bounds = L.latLngBounds(activeRoute.path);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (err) {
        // bounds fallback
      }
    }

    // 3. Incident Reports
    reports.forEach((rep) => {
      const marker = L.circleMarker([rep.latitude, rep.longitude], {
        radius: 8,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: rep.severity >= 4 ? '#ff3b30' : '#ff9500',
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `<div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600;">
          ${rep.title}<br/>
          <span style="font-weight: 400; color: #666;">${rep.address} · ${rep.verificationStatus}</span>
        </div>`
      );
      marker.on('click', () => onSelectReport?.(rep));
      marker.addTo(group);
    });

    // 4. Safe Havens Sanctuary Points
    safeHavens.forEach((haven) => {
      const marker = L.circleMarker([haven.latitude, haven.longitude], {
        radius: 7.5,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: '#0066cc', // Action Blue
        fillOpacity: 0.95,
      });

      marker.bindTooltip(
        `<div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600;">
          🏥 ${haven.name}<br/>
          <span style="font-weight: 400; color: #444;">${haven.address}</span>
        </div>`
      );
      marker.addTo(group);
    });

    // 5. User Location Beacon with Pulsing Halo
    if (userLocation) {
      // Accuracy pulse ring
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 20,
        color: 'transparent',
        fillColor: '#0066cc',
        fillOpacity: 0.16,
      }).addTo(group);

      // Core Beacon
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 9,
        color: '#FFFFFF',
        weight: 3,
        fillColor: '#0066cc',
        fillOpacity: 1,
      })
        .bindTooltip('<strong style="font-family: -apple-system, sans-serif;">Your Current Location</strong>')
        .addTo(group);
    }
  }, [zones, reports, safeHavens, routes, selectedRouteId, userLocation, onSelectZone, onSelectReport]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    }
  };

  // If Leaflet is not yet ready, show enhanced vector map
  if (!leafletReady) {
    return <SafetyMapViewNative {...props} />;
  }

  return (
    <div
      data-testid="safety-map-canvas"
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '18px', // rounded.lg from DESIGN.md
        overflow: 'hidden',
        border: '1px solid #e0e0e0', // hairline from DESIGN.md
        position: 'relative',
        backgroundColor: '#f5f5f7',
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Top Left: Apple-Frosted Google Maps Mode Selector ([Map] [Satellite] [Terrain]) */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 1000,
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          borderRadius: '9999px',
          padding: '3px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          gap: '2px',
        }}
      >
        {(['roadmap', 'satellite', 'terrain'] as GoogleMapType[]).map((type) => {
          const isActive = mapType === type;
          const labels: Record<GoogleMapType, string> = {
            roadmap: 'Map',
            satellite: 'Satellite',
            terrain: 'Terrain',
          };
          return (
            <button
              key={type}
              type="button"
              onClick={() => setMapType(type)}
              style={{
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: isActive ? '600' : '400',
                fontFamily: '-apple-system, SF Pro Text, sans-serif',
                backgroundColor: isActive ? '#0066cc' : 'transparent',
                color: isActive ? '#ffffff' : '#1d1d1f',
                transition: 'all 0.15s ease',
              }}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {/* Floating Apple-Design Map Controls ({component.button-icon-circular} 44x44px) */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Zoom In Button */}
        <button
          type="button"
          aria-label="Zoom in on map"
          onClick={handleZoomIn}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '600',
            color: '#1d1d1f',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          +
        </button>

        {/* Zoom Out Button */}
        <button
          type="button"
          aria-label="Zoom out on map"
          onClick={handleZoomOut}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '22px',
            fontWeight: '600',
            color: '#1d1d1f',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          −
        </button>

        {/* Recenter Button */}
        <button
          type="button"
          aria-label="Center map on current location"
          onClick={handleRecenter}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0066cc',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </button>
      </div>

      {/* Bottom Bar: Google Brand Watermark & Safety Legend Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Google Maps Watermark Badge */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            padding: '3px 7px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: 'Roboto, -apple-system, sans-serif',
            userSelect: 'none',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            letterSpacing: '0.2px',
          }}
        >
          <span style={{ color: '#4285F4' }}>G</span>
          <span style={{ color: '#EA4335' }}>o</span>
          <span style={{ color: '#FBBC05' }}>o</span>
          <span style={{ color: '#4285F4' }}>g</span>
          <span style={{ color: '#34A853' }}>l</span>
          <span style={{ color: '#EA4335' }}>e</span>
        </div>

        {/* Floating Map Legend Indicator Pill */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            padding: '5px 12px',
            border: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: '-apple-system, SF Pro Text, sans-serif',
            fontSize: '11px',
            color: '#1d1d1f',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#34c759' }} />
            Safe
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#ff9500' }} />
            Caution
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#ff3b30' }} />
            Concern
          </span>
          <span style={{ color: '#86868b' }}>| Zoom: {currentZoom}x</span>
        </div>
      </div>
    </div>
  );
};
