import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { tripStore } from "../storage/tripStore";
import { ActiveTrip, reduceTrip, GeoSample, TripStatus } from "../domain/trip";
import { WopSettings } from "../domain/settings";

const LOCATION_TASK_NAME = "wop-background-location";
const ALARM_NOTIFICATION_ID = "wop-alarm";

export interface BackgroundLocationConfig {
  accuracy: Location.LocationAccuracy;
  distanceInterval: number;
  timeInterval: number;
}

async function loadPersistedTripAndSettings(): Promise<{
  trip: ActiveTrip | null;
  settings: WopSettings;
}> {
  const [trip, settings] = await Promise.all([
    tripStore.getActiveTrip(),
    tripStore.getSettings(),
  ]);
  return {
    trip,
    settings: settings ?? {
      unit: "km",
      defaultRadiusMeters: 250,
      defaultDistanceMeters: 5000,
      soundEnabled: true,
      vibrationEnabled: true,
      highAccuracy: true,
      batteryGuidanceDismissed: false,
    },
  };
}

async function saveTrip(trip: ActiveTrip | null): Promise<void> {
  await tripStore.saveActiveTrip(trip);
}

async function triggerAlarmNotification(trip: ActiveTrip): Promise<void> {
  const { soundEnabled, vibrationEnabled } = trip.config;
  const channelId = "wop-alarm-channel";

  await Notifications.setNotificationChannelAsync(channelId, {
    name: "WOP Alarm",
    importance: "max" as Notifications.AndroidNotificationPriority,
    vibrationPattern: [0, 500, 200, 500],
    sound: "default",
    enableVibrate: vibrationEnabled,
    showBadge: true,
    lockscreenVisibility:
      "public" as Notifications.AndroidNotificationVisibility,
    bypassDnd: true,
  });

  await Notifications.scheduleNotificationAsync({
    identifier: ALARM_NOTIFICATION_ID,
    content: {
      title: "WOP Alarm",
      body: "You reached your destination.",
      sound: soundEnabled ? "default" : undefined,
      categoryIdentifier: "wop-alarm-category",
      data: { tripId: trip.id },
    },
    trigger: null,
  });
}

async function playAlarmSound(): Promise<Audio.Sound | null> {
  try {
    const sound = new Audio.Sound();
    await sound.loadAsync(require("../assets/alarm.wav"), {
      isLooping: true,
      shouldPlay: true,
      volume: 1.0,
    });
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    return sound;
  } catch {
    return null;
  }
}

async function stopAlarmSound(sound: Audio.Sound | null): Promise<void> {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
  }
}

interface LocationTaskData {
  locations?: Location.LocationObject[];
  error?: { message: string };
}

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: { data?: LocationTaskData; error?: Error }) => {
    if (error) {
      console.error("[WOP] Background location error:", error);
      return;
    }
    if (!data?.locations || data.locations.length === 0) return;

    const { trip, settings } = await loadPersistedTripAndSettings();
    if (!trip || (trip.status !== "tracking" && trip.status !== "arming")) {
      return;
    }

    const previousStatus: TripStatus = trip.status;

    const location = data.locations[data.locations.length - 1];
    if (!location) return;

    const sample: GeoSample = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracyMeters: location.coords.accuracy ?? undefined,
      timestamp: location.timestamp,
    };

    const nextTrip = reduceTrip(trip, { type: "location", sample });
    await saveTrip(nextTrip);

    const shouldTriggerAlarm =
      nextTrip.status === "alarming" &&
      (previousStatus as string) !== "alarming";
    if (shouldTriggerAlarm) {
      await triggerAlarmNotification(nextTrip);
      const alarmSound = await playAlarmSound();
      if (alarmSound) {
        await tripStore.saveActiveTrip({
          ...nextTrip,
          alarmSoundId: "active",
        } as any);
      }
    }
  },
);

export async function registerBackgroundLocationTask(
  config: BackgroundLocationConfig,
): Promise<void> {
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
      minimumInterval: config.timeInterval / 1000,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export async function startBackgroundLocationUpdates(
  config: BackgroundLocationConfig,
): Promise<void> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Background location permission not granted");
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: config.accuracy,
    distanceInterval: config.distanceInterval,
    timeInterval: config.timeInterval,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "WOP is tracking your trip",
      notificationBody: "Tap to open the app",
      notificationColor: "#70E1C1",
      enableWakeLock: true,
    },
  });
}

export async function stopBackgroundLocationUpdates(): Promise<void> {
  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

export async function hasBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === "granted";
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === "granted";
}

let activeAlarmSound: Audio.Sound | null = null;

export async function triggerFullScreenAlarm(trip: ActiveTrip): Promise<void> {
  await triggerAlarmNotification(trip);
  activeAlarmSound = await playAlarmSound();
}

export async function stopFullScreenAlarm(): Promise<void> {
  await stopAlarmSound(activeAlarmSound);
  activeAlarmSound = null;
  await Notifications.dismissNotificationAsync(ALARM_NOTIFICATION_ID);
}

export async function handleAlarmStopped(
  trip: ActiveTrip,
): Promise<ActiveTrip> {
  await stopFullScreenAlarm();
  const completed = reduceTrip(trip, { type: "alarm-stopped" });
  await saveTrip(null);
  const history = await tripStore.getHistory();
  await tripStore.saveHistory([
    { ...completed, finishedAt: Date.now() },
    ...history,
  ]);
  return completed;
}

export async function handleTripStop(trip: ActiveTrip): Promise<ActiveTrip> {
  await stopBackgroundLocationUpdates();
  await stopFullScreenAlarm();
  const stopped = reduceTrip(trip, { type: "stop" });
  await saveTrip(null);
  const history = await tripStore.getHistory();
  await tripStore.saveHistory([
    { ...stopped, finishedAt: Date.now() },
    ...history,
  ]);
  return stopped;
}
