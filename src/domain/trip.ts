import { Coordinate, GeoSample, distanceMeters, hasTraveledDistance, isInsideRadius, isPlausibleSample } from './geo.js';

export type TriggerMode = 'arrival' | 'distance';
export type TripStatus = 'idle' | 'arming' | 'tracking' | 'alarming' | 'completed' | 'stopped' | 'error';

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

export type TripEvent =
  | { type: 'location'; sample: GeoSample }
  | { type: 'permission-denied'; message: string }
  | { type: 'stop' }
  | { type: 'alarm-stopped' }
  | { type: 'reset' };

export function createTrip(config: TripConfig, now = Date.now()): ActiveTrip {
  return {
    id: `trip_${now}`,
    startedAt: now,
    status: 'arming',
    config,
    traveledMeters: 0,
  };
}

export function reduceTrip(trip: ActiveTrip, event: TripEvent): ActiveTrip {
  if (event.type === 'reset') return { ...trip, status: 'idle', errorMessage: undefined };
  if (event.type === 'stop') return { ...trip, status: 'stopped' };
  if (event.type === 'alarm-stopped') {
    return trip.status === 'alarming' ? { ...trip, status: 'completed' } : trip;
  }
  if (event.type === 'permission-denied') {
    return { ...trip, status: 'error', errorMessage: event.message };
  }
  if (trip.status === 'alarming' || trip.status === 'completed' || trip.status === 'stopped') return trip;

  const { sample } = event;
  if (!isPlausibleSample(trip.lastSample, sample)) return trip;
  const startCoordinate = trip.startCoordinate ?? sample;
  const traveledMeters = Math.max(trip.traveledMeters, distanceMeters(startCoordinate, sample));
  const destination = trip.config.destination;
  const shouldAlarm = trip.config.mode === 'arrival'
    ? Boolean(destination && isInsideRadius(sample, destination.coordinate, trip.config.radiusMeters, sample.accuracyMeters))
    : hasTraveledDistance(startCoordinate, sample, trip.config.distanceMeters);

  return {
    ...trip,
    status: shouldAlarm ? 'alarming' : 'tracking',
    startCoordinate,
    lastSample: sample,
    traveledMeters,
    alarmedAt: shouldAlarm ? (trip.alarmedAt ?? sample.timestamp) : trip.alarmedAt,
  };
}
