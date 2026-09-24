export type Coordinate = {
    latitude: number;
    longitude: number;
};
export type GeoSample = Coordinate & {
    accuracyMeters?: number;
    timestamp: number;
};
export declare function distanceMeters(from: Coordinate, to: Coordinate): number;
export declare function isInsideRadius(current: Coordinate, destination: Coordinate, radiusMeters: number, accuracyMeters?: number): boolean;
export declare function hasTraveledDistance(start: Coordinate, current: Coordinate, targetMeters: number): boolean;
/** Ignore implausible GPS jumps while allowing normal pedestrian/vehicle motion. */
export declare function isPlausibleSample(previous: GeoSample | undefined, next: GeoSample, maxSpeedMetersPerSecond?: number): boolean;
export declare function formatDistance(meters: number, unit?: "km" | "mi"): string;
