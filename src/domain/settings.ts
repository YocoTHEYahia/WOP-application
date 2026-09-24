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

export const DEFAULT_SETTINGS: WopSettings = {
  unit: "km",
  defaultRadiusMeters: 250,
  defaultDistanceMeters: 5000,
  soundEnabled: true,
  vibrationEnabled: true,
  highAccuracy: true,
  batteryGuidanceDismissed: false,
};
