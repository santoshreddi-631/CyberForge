const EARTH_RADIUS_KM = 6371;

export interface GeoPoint {
  lat: number;
  lng: number;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function haversineDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const latitude = toRadians(from.lat);
  const targetLatitude = toRadians(to.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latitude) * Math.cos(targetLatitude) * Math.sin(deltaLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export const distanceKm = haversineDistanceKm;
