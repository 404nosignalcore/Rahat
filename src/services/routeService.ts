import { PRESET_ROUTES } from '../data/mockSafetyData';
import { RouteOption } from '../types/safety';
import { compareRouteSafety } from '../utils/safetyRiskEngine';
import { IRoutingService } from './contracts';

export const routeService: IRoutingService = {
  async findSaferRoutes(originQuery: string, destinationQuery: string, currentHour: number): Promise<RouteOption[]> {
    const cleanOrigin = originQuery.trim() || 'Janpath Metro Gate 2';
    const cleanDest = destinationQuery.trim() || 'Mandi House Cultural Campus';

    return PRESET_ROUTES.map((route) => {
      const comparison = compareRouteSafety(route, currentHour);
      return {
        ...route,
        originLabel: cleanOrigin,
        destinationLabel: cleanDest,
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
