import { Coordinate, GeoSample } from "./geo.js";
export type { GeoSample };
export type TriggerMode = "arrival" | "distance";
export type TripStatus = "idle" | "arming" | "tracking" | "alarming" | "completed" | "stopped" | "error";
export type Destination = {
    id: string;
    label: string;
    address?: string;
    coordinate: Coordinate;
    createdAt: number;
};
export type TripConfig = {
    mode: TriggerMode;
    destination?: Destination;
    radiusMeters: number;
    distanceMeters: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
};
export type ActiveTrip = {
    id: string;
    startedAt: number;
    status: TripStatus;
    config: TripConfig;
    startCoordinate?: Coordinate;
    lastSample?: GeoSample;
    traveledMeters: number;
    alarmedAt?: number;
    errorMessage?: string;
};
export type TripEvent = {
    type: "location";
    sample: GeoSample;
} | {
    type: "permission-denied";
    message: string;
} | {
    type: "stop";
} | {
    type: "alarm-stopped";
} | {
    type: "reset";
};
export declare function createTrip(config: TripConfig, now?: number): ActiveTrip;
export declare function reduceTrip(trip: ActiveTrip, event: TripEvent): ActiveTrip;
