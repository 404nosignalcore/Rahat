import { PRESET_ROUTES } from '../data/mockSafetyData';
import { RouteOption } from '../types/safety';
import { compareRouteSafety } from '../utils/safetyRiskEngine';
import { IRoutingService } from './contracts';

export const routeService: IRoutingService = {
  async findSaferRoutes(originQuery: string, destinationQuery: string, currentHour: number): Promise<RouteOption[]> {
    const cleanOrigin = originQuery.trim() || 'Janpath Metro Gate 2';
    const cleanDest = destinationQuery.trim() || 'Mandi House Cultural Campus';

    // Simulate async routing calculation
    await new Promise((resolve) => setTimeout(resolve, 350));

    const baseRoutes: RouteOption[] = [
      {
        id: `route-safer-${Date.now()}`,
        name: `${cleanOrigin} → ${cleanDest} (Lit Corridor)`,
        nameHi: `${cleanOrigin} से ${cleanDest} (सुरक्षित गलियारा)`,
        originLabel: cleanOrigin,
        destinationLabel: cleanDest,
        isRecommended: true,
        safetyScore: 91,
        distanceKm: 1.6,
        durationMins: 19,
        lightingPercentage: 96,
        cctvCoveragePercentage: 90,
        safeHavensEnRoute: 3,
        riskZonesCrossed: [
          { name: 'Connaught Place Plaza', level: 'safe' },
          { name: 'Barakhamba Corridor', level: 'safe' },
        ],
        path: [
          [28.6275, 77.2185],
          [28.6300, 77.2192],
          [28.6322, 77.2198],
          [28.6315, 77.2245],
          [28.6310, 77.2255],
          [28.6280, 77.2285],
          [28.6255, 77.2310],
        ],
        rationale: 'Algorithmically weighted for maximum street illumination, active commercial storefronts, and verified safe sanctuaries.',
        rationaleHi: 'अधिकतम स्ट्रीटलाइटिंग, व्यावसायिक क्षेत्र एवं सत्यापित सुरक्षित केंद्रों पर आधारित मार्ग।',
      },
      {
        id: `route-direct-${Date.now()}`,
        name: `${cleanOrigin} → ${cleanDest} (Commercial Radial)`,
        nameHi: `${cleanOrigin} से ${cleanDest} (सीधा वाणिज्यिक मार्ग)`,
        originLabel: cleanOrigin,
        destinationLabel: cleanDest,
        isRecommended: false,
        safetyScore: 74,
        distanceKm: 1.3,
        durationMins: 15,
        lightingPercentage: 72,
        cctvCoveragePercentage: 65,
        safeHavensEnRoute: 1,
        riskZonesCrossed: [
          { name: 'Inner Circle Radial', level: 'safe' },
          { name: 'Service Alley Sector 4', level: 'caution' },
        ],
        path: [
          [28.6275, 77.2185],
          [28.6290, 77.2210],
          [28.6270, 77.2260],
          [28.6255, 77.2310],
        ],
        rationale: 'Direct route saving 4 minutes with moderate illumination, but intersects one low-visibility service alley.',
        rationaleHi: '4 मिनट की बचत वाला सीधा मार्ग, मध्यम रोशनी किंतु एक कम दृश्यता वाली गली से गुजरता है।',
      },
      {
        id: `route-fastest-${Date.now()}`,
        name: `${cleanOrigin} → ${cleanDest} (Shortest Shortcut)`,
        nameHi: `${cleanOrigin} से ${cleanDest} (शॉर्टकट मार्ग)`,
        originLabel: cleanOrigin,
        destinationLabel: cleanDest,
        isRecommended: false,
        safetyScore: 46,
        distanceKm: 1.0,
        durationMins: 11,
        lightingPercentage: 38,
        cctvCoveragePercentage: 22,
        safeHavensEnRoute: 0,
        riskZonesCrossed: [
          { name: 'Unlit Alley Junction', level: 'danger' },
          { name: 'Subway Underpass', level: 'caution' },
        ],
        path: [
          [28.6275, 77.2185],
          [28.6260, 77.2230],
          [28.6255, 77.2310],
        ],
        rationale: 'Shortest distance, but has only 38% lighting and crosses isolated subway underpass. Not recommended after 8 PM.',
        rationaleHi: 'सबसे छोटा मार्ग, परंतु मात्र 38% रोशनी एवं एकांत सबवे से गुजरता है। रात 8 बजे के बाद अनुशंसित नहीं।',
      },
    ];

    return baseRoutes.map((route) => {
      const comparison = compareRouteSafety(route, currentHour);
      return {
        ...route,
        safetyScore: comparison.adjustedScore,
      };
    });
  },

  async recalculateFromPosition(
    lat: number,
    lng: number,
    destinationLabel: string,
    currentHour: number
  ): Promise<RouteOption> {
    const baseSafe = PRESET_ROUTES[0];
    const comparison = compareRouteSafety(baseSafe, currentHour);
    return {
      ...baseSafe,
      id: `recalc-${Date.now()}`,
      name: 'Recalculated Lit Corridor',
      nameHi: 'पुनर्गणना किया गया रोशनी युक्त मार्ग',
      originLabel: `Current Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      destinationLabel: destinationLabel || baseSafe.destinationLabel,
      safetyScore: comparison.adjustedScore,
      path: [
        [lat, lng],
        ...baseSafe.path.slice(2),
      ],
      rationale: 'Recalculated from your current coordinates back onto well-lit main corridors passing verified help points.',
      rationaleHi: 'आपकी वर्तमान स्थिति से मुख्य रोशनी वाले मार्ग पर पुनः निर्देशित किया गया।',
    };
  },
};
