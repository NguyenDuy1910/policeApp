import type Database from 'better-sqlite3';

interface CandidateUnit {
  id: number;
  latitude: number;
  longitude: number;
}

export function haversineDistanceMeters(firstLatitude: number, firstLongitude: number, secondLatitude: number, secondLongitude: number): number {
  const radians = Math.PI / 180;
  const latitudeDelta = (secondLatitude - firstLatitude) * radians;
  const longitudeDelta = (secondLongitude - firstLongitude) * radians;
  const firstRadians = firstLatitude * radians;
  const secondRadians = secondLatitude * radians;
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstRadians) * Math.cos(secondRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

/** Nearest active, verified police unit with coordinates; null when none is eligible. */
export function findNearestVerifiedUnitId(connection: Database.Database, latitude: number, longitude: number): number | null {
  const candidates = connection
    .prepare(`
      SELECT id, latitude, longitude FROM police_units
      WHERE active = 1 AND verified = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
    `)
    .all() as CandidateUnit[];
  let nearestId: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = haversineDistanceMeters(latitude, longitude, candidate.latitude, candidate.longitude);
    if (distance < nearestDistance) {
      nearestId = candidate.id;
      nearestDistance = distance;
    }
  }
  return nearestId;
}
