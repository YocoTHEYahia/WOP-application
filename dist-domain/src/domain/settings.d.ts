export type DistanceUnit = "km" | "mi";
export type WopSettings = {
    unit: DistanceUnit;
    defaultRadiusMeters: number;
    defaultDistanceMeters: number;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    highAccuracy: boolean;
    batteryGuidanceDismissed: boolean;
};
export declare const DEFAULT_SETTINGS: WopSettings;
