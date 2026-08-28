export type MapScope = 'india' | 'world' | 'current';
export type MapDifficulty = 'easy' | 'medium' | 'hard';
export type MapQuestionType =
  | 'map_click_point'
  | 'map_click_line'
  | 'map_click_polygon'
  | 'drag_label'
  | 'identify_marker';

export type LatLngPoint = {
  lat: number;
  lng: number;
};

export type MapLocation = {
  id: string;
  name: string;
  category: string;
  map_scope: MapScope;
  latitude: number;
  longitude: number;
  difficulty?: string | null;
  is_current_affairs?: boolean | null;
};

export type MapQuestion = {
  id: string;
  question_text: string;
  question_text_en?: string;
  question_text_hi?: string;
  question_type: MapQuestionType;
  main_topic: string;
  subtopic: string;
  map_scope: MapScope;
  region_hint: string;
  difficulty: string | null;
  exam_tags: string[] | null;
  is_current_affairs: boolean;
  current_affairs_month: string | null;
};

export type MapAnswerResult = {
  isCorrect: boolean;
  distanceKm: number;
  toleranceKm: number;
  correctPoint: LatLngPoint;
  correctLocationName: string;
  explanation: string | null;
};

export type ReviewAttempt = {
  questionId: string;
  questionText: string;
  selectedPoint: LatLngPoint | null;
  correctPoint: LatLngPoint;
  distanceKm: number;
  toleranceKm: number;
  isCorrect: boolean;
  timedOut: boolean;
  explanation: string | null;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeMapScope(value: string | null | undefined): MapScope {
  if (value === 'india' || value === 'world' || value === 'current') {
    return value;
  }
  return 'india';
}

export function normalizeDifficulty(value: string | null | undefined): MapDifficulty | 'all' {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }
  return 'all';
}

export function fallbackToleranceByDifficulty(difficulty: string | null | undefined): number {
  if (difficulty === 'easy') return 60;
  if (difficulty === 'hard') return 25;
  return 40;
}

export function getEffectiveToleranceKm(question: {
  tolerance_km?: number | string | null;
  difficulty?: string | null;
}): number {
  const dbTolerance = Number(question.tolerance_km);
  if (Number.isFinite(dbTolerance) && dbTolerance > 0) {
    return dbTolerance;
  }
  return fallbackToleranceByDifficulty(question.difficulty);
}

export function getBroadMapRegionHint(latitude: number, longitude: number, scope: MapScope) {
  if (scope === 'india') {
    if (latitude >= 26) return 'Hint: The location is in the northern India belt.';
    if (latitude <= 14) return 'Hint: The location is in the southern India belt.';
    if (longitude <= 76) return 'Hint: The location is towards western or central India.';
    return 'Hint: The location is towards eastern or central India.';
  }

  const northSouth = latitude >= 0 ? 'Northern Hemisphere' : 'Southern Hemisphere';
  const eastWest = longitude >= 0 ? 'Eastern Hemisphere' : 'Western Hemisphere';
  return `Hint: The location lies in the ${northSouth} and ${eastWest}.`;
}
