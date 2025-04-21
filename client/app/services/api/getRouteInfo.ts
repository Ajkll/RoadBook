import axios from 'axios';
import { calculateAverageSpeed } from '../../utils/firebase/driveSessionUtils';

const GEOAPIFY_API_KEY = 'ccdaca2c37ee4ca4a1ccc512e8ee4283'; // À remplacer par votre clé API Geoapify

/**
 * Récupère les informations de route détaillées en utilisant l'API Geoapify Map Matching
 * avec logs détaillés de la réponse complète de l'API
 */
export async function getGeoapifyRouteInfo(
  path: { latitude: number; longitude: number; timestamp?: string }[],
  elapsedTimeSeconds: number
) {
  if (!path || path.length < 2) {
    console.warn('api geoapify : refus car chemins trop court', { pathLength: path?.length });
    return null;
  }

  try {
    // L'API accepte jusqu'à 1000 points, donc pas besoin d'échantillonnage pour la plupart des cas
    const waypoints = path.map(point => ({
      location: [point.longitude, point.latitude],
      timestamp: point.timestamp || new Date().toISOString() // Utilise le timestamp s'il existe
    }));

    // la requete pour geoapify
    const url = 'https://api.geoapify.com/v1/mapmatching';

    const requestBody = {
      mode: "drive", // Modes possible: "drive", "walk", "bicycle"
      waypoints: waypoints
    };

    // Faire la requête à l'API Geoapify
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        apiKey: GEOAPIFY_API_KEY
      }
    });
    console.log('la réponse:',
      JSON.stringify(Object.keys(response.data), null, 2));

    if (response.data.type !== "FeatureCollection" || !response.data.features || !response.data.features.length) {
      console.error('Format de réponse inattendu (geoapify)');
      return null;
    }

    // Extraction des données utiles
    const feature = response.data.features[0];
    const props = feature.properties;
    const totalDistanceMeters = props.distance;
    const distanceKm = totalDistanceMeters / 1000;
    const durationMinutes = elapsedTimeSeconds / 60;

    // Calcul de la vitesse moyenne
    const averageSpeed = calculateAverageSpeed(path, elapsedTimeSeconds);

    console.log(` Distance=${distanceKm.toFixed(2)}km, Durer réelle=${durationMinutes.toFixed(2)}min, Vitesse average=${averageSpeed.toFixed(2)}km/h`);

    // Analyser les étapes pour extraire les types de routes et les conditions de trafic
    const roadTypes: Record<string, number> = {};
    const traffic: Record<string, number> = {};

    props.legs.forEach((leg: any) => {
      leg.steps.forEach((step: any) => {
        const roadClass = step.road_class || 'unknown';
        if (!roadTypes[roadClass]) {
          roadTypes[roadClass] = 0;
        }
        roadTypes[roadClass] += step.distance;
        let trafficCondition = 'fluide';

        if (step.speed_limit && step.speed) {
          const speedRatio = step.speed / step.speed_limit;

          if (speedRatio < 0.5) {
            trafficCondition = 'congestionné';
          } else if (speedRatio < 0.7) {
            trafficCondition = 'dense';
          } else if (speedRatio < 0.9) {
            trafficCondition = 'modéré';
          }
        }

        if (!traffic[trafficCondition]) {
          traffic[trafficCondition] = 0;
        }
        traffic[trafficCondition] += step.distance;
      });
    });
    const resultObject = {
      summary: {
        totalDistanceKm: parseFloat(distanceKm.toFixed(2)),
        totalDurationMinutes: parseFloat(durationMinutes.toFixed(2)),
        trafficDelayMinutes: parseFloat(((props.time / 60) - durationMinutes).toFixed(2)),
      },
      roadTypes: normalizeDistances(roadTypes),
      traffic: normalizeDistances(traffic),
      roadTypesDistribution: calculateDistribution(roadTypes),
      trafficDistribution: calculateDistribution(traffic),
      urbanRuralDistribution: extractUrbanRuralDistribution(roadTypes),
      speed: {
        average: parseFloat(averageSpeed.toFixed(2)),
      },
      detailedInfo: {
        matchedPoints: props.waypoints.length,
        matchQuality: calculateMatchQuality(props.waypoints),
        surfaceTypes: extractSurfaceTypes(props.legs)
      }
    };

    console.log(' objet json final :', JSON.stringify(resultObject, null, 2));

    return resultObject;
  } catch (error: any) {
    if (error.response) {
      console.error('Url de Geoapify :', error.config?.url);
      console.error('la requete:', JSON.stringify(error.config?.params, null, 2));
      console.error('la réponse:', error.response?.data);
    }

    return null;
  }
}

// Matching pour évaluer la qualités des réponses de l'api
function calculateMatchQuality(waypoints: any[]): string {
  if (!waypoints || !waypoints.length) return 'unknown';

  const matchedCount = waypoints.filter(wp => wp.match_type === 'matched').length;
  const matchPercent = (matchedCount / waypoints.length) * 100;

  if (matchPercent > 90) return 'excellent';
  if (matchPercent > 75) return 'good';
  if (matchPercent > 50) return 'average';
  return 'poor';
}

// Exctraction du type de route/s
function extractSurfaceTypes(legs: any[]): Record<string, number> {
  const surfaces: Record<string, number> = {};

  legs.forEach(leg => {
    leg.steps.forEach((step: any) => {
      const surface = step.surface || 'unknown';
      if (!surfaces[surface]) {
        surfaces[surface] = 0;
      }
      surfaces[surface] += step.distance;
    });
  });

  return normalizeDistances(surfaces);
}

function normalizeDistances(distancesMap: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, meters] of Object.entries(distancesMap)) {
    result[key] = parseFloat((meters / 1000).toFixed(2));
  }
  return result;
}

function calculateDistribution(distancesMap: Record<string, number>): Record<string, number> {
  const total = Object.values(distancesMap).reduce((sum, val) => sum + val, 0);
  if (total === 0) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(distancesMap)) {
    result[key] = parseFloat(((value / total) * 100).toFixed(1));
  }
  return result;
}

function extractUrbanRuralDistribution(roadTypes: Record<string, number>): {
  urban: number;
  rural: number;
  highway: number;
} {
  let urban = 0;
  let rural = 0;
  let highway = 0;
  const totalDistance = Object.values(roadTypes).reduce((sum, val) => sum + val, 0);

  for (const [type, distance] of Object.entries(roadTypes)) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('motorway') || lowerType.includes('trunk')) {
      highway += distance;
    } else if (lowerType.includes('residential') || lowerType.includes('unclassified') || lowerType.includes('service')) {
      urban += distance;
    } else if (lowerType.includes('primary') || lowerType.includes('secondary') || lowerType.includes('tertiary')) {
      // hypothese baser sur la classe de route
      rural += distance;
    } else {
      rural += distance;
    }
  }

  if (totalDistance === 0) {
    return { urban: 0, rural: 100, highway: 0 };
  }

  return {
    urban: parseFloat(((urban / totalDistance) * 100).toFixed(1)),
    rural: parseFloat(((rural / totalDistance) * 100).toFixed(1)),
    highway: parseFloat(((highway / totalDistance) * 100).toFixed(1))
  };
}


//to do certain fallback serait pertinent ! comme par exemple calculer la distance nous meme si l'api ne nous la donne pas