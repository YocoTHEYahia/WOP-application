import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveTrip, Destination } from '../domain/trip';
import { DEFAULT_SETTINGS, WopSettings } from '../domain/settings';

const KEYS = {
  activeTrip: '@wop/active-trip',
  history: '@wop/trip-history',
  destinations: '@wop/destinations',
  settings: '@wop/settings',
} as const;

export type TripHistoryEntry = ActiveTrip & { finishedAt: number };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const tripStore = {
  getActiveTrip: () => readJson<ActiveTrip | null>(KEYS.activeTrip, null),
  saveActiveTrip: (trip: ActiveTrip | null) => trip ? AsyncStorage.setItem(KEYS.activeTrip, JSON.stringify(trip)) : AsyncStorage.removeItem(KEYS.activeTrip),
  getHistory: () => readJson<TripHistoryEntry[]>(KEYS.history, []),
  saveHistory: (history: TripHistoryEntry[]) => AsyncStorage.setItem(KEYS.history, JSON.stringify(history.slice(0, 50))),
  getDestinations: () => readJson<Destination[]>(KEYS.destinations, []),
  saveDestinations: (destinations: Destination[]) => AsyncStorage.setItem(KEYS.destinations, JSON.stringify(destinations.slice(0, 50))),
  getSettings: () => readJson<WopSettings>(KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: (settings: WopSettings) => AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings)),
};
