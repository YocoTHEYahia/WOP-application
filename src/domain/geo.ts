export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type GeoSample = Coordinate & {
  accuracyMeters?: number;
  timestamp: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function distanceMeters(from: Coordinate, to: Coordinate): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideRadius(
  current: Coordinate,
  destination: Coordinate,
  radiusMeters: number,
  accuracyMeters = 0,
): boolean {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return false;
  if (accuracyMeters > Math.max(radiusMeters * 1.5, 100)) return false;
  return distanceMeters(current, destination) <= radiusMeters;
}

export function hasTraveledDistance(
  start: Coordinate,
  current: Coordinate,
  targetMeters: number,
): boolean {
  return (
    Number.isFinite(targetMeters) &&
    targetMeters > 0 &&
    distanceMeters(start, current) >= targetMeters
  );
}

/** Ignore implausible GPS jumps while allowing normal pedestrian/vehicle motion. */
export function isPlausibleSample(
  previous: GeoSample | undefined,
  next: GeoSample,
  maxSpeedMetersPerSecond = 80,
): boolean {
  if (!previous) return true;
  const elapsedSeconds = (next.timestamp - previous.timestamp) / 1000;
  if (elapsedSeconds <= 0) return false;
  const maxDistance =
    maxSpeedMetersPerSecond * elapsedSeconds +
    (next.accuracyMeters ?? 0) +
    (previous.accuracyMeters ?? 0);
  return distanceMeters(previous, next) <= maxDistance;
}

export function formatDistance(
  meters: number,
  unit: "km" | "mi" = "km",
): string {
  const value = unit === "mi" ? meters / 1609.344 : meters / 1000;
  if (value < 1) return `${Math.round(meters)} m`;
  return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}
