export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const CA_MAU_CENTER: Coordinates = { latitude: 9.1768, longitude: 105.1524 };
export const CA_MAU_REGION = { ...CA_MAU_CENTER, latitudeDelta: 0.035, longitudeDelta: 0.035 } as const;

/** Broad bounds of Cà Mau after the 2025 provincial reorganisation, including the former Bạc Liêu area. */
export function isWithinCaMauServiceArea({ latitude, longitude }: Coordinates): boolean {
  return latitude >= 8.35 && latitude <= 9.75 && longitude >= 104.65 && longitude <= 106.05;
}

export function distanceMeters(first: Coordinates, second: Coordinates): number {
  const radians = Math.PI / 180;
  const latitudeDelta = (second.latitude - first.latitude) * radians;
  const longitudeDelta = (second.longitude - first.longitude) * radians;
  const firstRadians = first.latitude * radians;
  const secondRadians = second.latitude * radians;
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstRadians) * Math.cos(secondRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function formatDistance(meters: number): string {
  if (meters < 1_000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: meters < 10_000 ? 1 : 0 })} km`;
}

export function normalizeVietnameseSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .toLocaleLowerCase('vi')
    .trim();
}
