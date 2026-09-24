// Expo modules type declarations - Updated to match actual exports
declare module "expo-location" {
  export type LocationAccuracy = 1 | 2 | 3 | 4 | 5 | 6;
  export type LocationActivityType =
    | "Other"
    | "AutomotiveNavigation"
    | "Fitness"
    | "OtherNavigation"
    | "Airborne";
  export type LocationGeofencingEventType = "Enter" | "Exit";
  export type LocationGeofencingRegionState = "Unknown" | "Inside" | "Outside";

  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface LocationPermissionResponse {
    status: "granted" | "denied" | "undetermined";
    canAskAgain: boolean;
    expires: "never" | number;
    granted: boolean;
  }

  export interface LocationProviderStatus {
    locationServicesEnabled: boolean;
    backgroundModeEnabled: boolean;
  }

  export interface LocationGeocodedLocation {
    latitude: number;
    longitude: number;
  }

  export interface LocationGeocodedAddress {
    name: string;
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    isoCountryCode: string;
    timezone: string;
  }

  export interface LocationRegion {
    identifier: string;
    latitude: number;
    longitude: number;
    radius: number;
    notifyOnEnter: boolean;
    notifyOnExit: boolean;
  }

  export interface LocationHeadingObject {
    magHeading: number;
    trueHeading: number;
    accuracy: number;
    x: number;
    y: number;
    z: number;
    timestamp: number;
  }

  export interface LocationSubscription {
    remove(): void;
  }

  export const Accuracy: {
    Lowest: 1;
    Low: 2;
    Balanced: 3;
    High: 4;
    Highest: 5;
    BestForNavigation: 6;
  };

  export type LocationAccuracy = (typeof Accuracy)[keyof typeof Accuracy];

  export const ActivityType: {
    Other: 1;
    AutomotiveNavigation: 2;
    Fitness: 3;
    OtherNavigation: 4;
    Airborne: 5;
  };

  export const GeofencingEventType: { Enter: 1; Exit: 2 };
  export const GeofencingRegionState: { Unknown: 0; Inside: 1; Outside: 2 };

  export function getProviderStatusAsync(): Promise<LocationProviderStatus>;
  export function enableNetworkProviderAsync(): Promise<void>;
  export function getCurrentPositionAsync(options?: {
    accuracy?: LocationAccuracy;
    maximumAge?: number;
    timeout?: number;
  }): Promise<LocationObject>;
  export function getLastKnownPositionAsync(options?: {
    accuracy?: LocationAccuracy;
    maximumAge?: number;
    requiredAccuracy?: number;
  }): Promise<LocationObject | null>;
  export function watchPositionAsync(
    options: {
      accuracy?: LocationAccuracy;
      distanceInterval?: number;
      timeInterval?: number;
    },
    callback: (location: LocationObject) => void,
    errorHandler?: (error: string) => void,
  ): Promise<LocationSubscription>;
  export function getHeadingAsync(): Promise<LocationHeadingObject>;
  export function watchHeadingAsync(
    callback: (heading: LocationHeadingObject) => void,
    errorHandler?: (error: string) => void,
  ): Promise<LocationSubscription>;
  export function geocodeAsync(
    address: string,
  ): Promise<LocationGeocodedLocation[]>;
  export function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
  }): Promise<LocationGeocodedAddress[]>;
  export function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getBackgroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function requestBackgroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function hasServicesEnabledAsync(): Promise<boolean>;
  export function startLocationUpdatesAsync(
    taskName: string,
    options: {
      accuracy?: LocationAccuracy;
      distanceInterval?: number;
      timeInterval?: number;
      showsBackgroundLocationIndicator?: boolean;
      foregroundService?: {
        notificationTitle: string;
        notificationBody: string;
        notificationColor?: string;
        enableWakeLock?: boolean;
      };
    },
  ): Promise<void>;
  export function stopLocationUpdatesAsync(taskName: string): Promise<void>;
  export function hasStartedLocationUpdatesAsync(
    taskName: string,
  ): Promise<boolean>;
  export function startGeofencingAsync(
    taskName: string,
    regions: LocationRegion[],
  ): Promise<void>;
  export function stopGeofencingAsync(taskName: string): Promise<void>;
  export function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;

  export function useForegroundPermissions(): [
    LocationPermissionResponse | null,
    () => Promise<LocationPermissionResponse>,
  ];
  export function useBackgroundPermissions(): [
    LocationPermissionResponse | null,
    () => Promise<LocationPermissionResponse>,
  ];
}

declare module "expo-task-manager" {
  export interface TaskManagerTaskData {
    locations?: any[];
    eventType?: number;
    region?: any;
    error?: { message: string };
  }

  export function defineTask(
    taskName: string,
    callback: (data: { data?: TaskManagerTaskData; error?: Error }) => void,
  ): void;
  export function isTaskRegisteredAsync(taskName: string): Promise<boolean>;
  export function unregisterTaskAsync(taskName: string): Promise<void>;
  export function getRegisteredTasksAsync(): Promise<
    Array<{ taskName: string }>
  >;
}

declare module "expo-background-fetch" {
  export function registerTaskAsync(
    taskName: string,
    options: {
      minimumInterval: number;
      stopOnTerminate: boolean;
      startOnBoot: boolean;
    },
  ): Promise<void>;
  export function unregisterTaskAsync(taskName: string): Promise<void>;
  export function setMinimumIntervalAsync(
    minimumInterval: number,
  ): Promise<void>;
  export function getStatusAsync(): Promise<number>;
}

declare module "expo-av" {
  export namespace Audio {
    export interface AudioMode {
      allowsRecordingIOS?: boolean;
      interruptionModeIOS?: string;
      playsInSilentModeIOS?: boolean;
      staysActiveInBackground?: boolean;
      interruptionModeAndroid?: string;
      shouldDuckAndroid?: boolean;
      playThroughEarpieceAndroid?: boolean;
    }

    export interface SoundOptions {
      isLooping?: boolean;
      shouldPlay?: boolean;
      volume?: number;
    }

    export class Sound {
      loadAsync(source: any, options?: SoundOptions): Promise<{ sound: Sound }>;
      playAsync(): Promise<void>;
      stopAsync(): Promise<void>;
      unloadAsync(): Promise<void>;
      setOnPlaybackStatusUpdate(callback: (status: any) => void): void;
    }

    export function setAudioModeAsync(mode: AudioMode): Promise<void>;
  }
}

declare module "expo-notifications" {
  export type AndroidNotificationPriority =
    "min" | "low" | "default" | "high" | "max";
  export type AndroidNotificationVisibility = "secret" | "private" | "public";

  export interface NotificationChannel {
    name: string;
    importance: AndroidNotificationPriority;
    vibrationPattern?: number[];
    sound?: string;
    enableVibrate?: boolean;
    showBadge?: boolean;
    lockscreenVisibility?: AndroidNotificationVisibility;
    bypassDnd?: boolean;
  }

  export interface NotificationContent {
    title: string;
    body: string;
    sound?: string | boolean;
    categoryIdentifier?: string;
    data?: Record<string, any>;
  }

  export interface NotificationTrigger {
    type:
      | "timeInterval"
      | "calendar"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "date";
    seconds?: number;
    repeats?: boolean;
    dateComponents?: any;
  }

  export function setNotificationChannelAsync(
    channelId: string,
    channel: NotificationChannel,
  ): Promise<void>;
  export function scheduleNotificationAsync(notification: {
    identifier?: string;
    content: NotificationContent;
    trigger: NotificationTrigger | null;
  }): Promise<string>;
  export function dismissNotificationAsync(identifier: string): Promise<void>;
  export function dismissAllNotificationsAsync(): Promise<void>;
  export function getPermissionsAsync(): Promise<{
    status: "granted" | "denied" | "undetermined";
    granted: boolean;
    canAskAgain: boolean;
  }>;
  export function requestPermissionsAsync(permissions?: {
    ios?: { allowAlert: boolean; allowBadge: boolean; allowSound: boolean };
  }): Promise<{
    status: "granted" | "denied" | "undetermined";
    granted: boolean;
    canAskAgain: boolean;
  }>;
}

declare module "expo-status-bar" {
  export interface StatusBarProps {
    barStyle?: "light-content" | "dark-content" | "default";
    hidden?: boolean;
    backgroundColor?: string;
    translucent?: boolean;
  }
  export function StatusBar(props: StatusBarProps): any;
}

declare module "expo-device" {
  export interface DeviceInfo {
    brand: string;
    manufacturer: string;
    modelName: string;
    osVersion: string;
    totalMemory: number;
    supportedCpuArchitectures: string[];
  }
  export function getDeviceInfoAsync(): Promise<DeviceInfo>;
  export function isDevice(): boolean;
}

declare module "expo-build-properties" {
  export interface BuildPropertiesConfig {
    android?: {
      compileSdkVersion?: number;
      targetSdkVersion?: number;
      minSdkVersion?: number;
      buildToolsVersion?: string;
      kotlinVersion?: string;
      extraMavenRepos?: string[];
    };
    ios?: {
      deploymentTarget?: string;
      useFrameworks?: "static" | "dynamic";
    };
  }
}
