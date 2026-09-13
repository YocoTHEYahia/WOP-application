import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip, reduceTrip } from '../src/domain/trip.js';

test('arrival trip transitions from arming to tracking and alarm', () => {
  const destination = { id: 'd1', label: 'Home', coordinate: { latitude: 30, longitude: 31 }, createdAt: 1 };
  const trip = createTrip({ mode: 'arrival', destination, radiusMeters: 250, distanceMeters: 5_000, soundEnabled: true, vibrationEnabled: true }, 1);
  const tracking = reduceTrip(trip, { type: 'location', sample: { latitude: 29.99, longitude: 31, timestamp: 2, accuracyMeters: 5 } });
  assert.equal(tracking.status, 'tracking');
  const alarming = reduceTrip(tracking, { type: 'location', sample: { latitude: 30, longitude: 31, timestamp: 3, accuracyMeters: 5 } });
  assert.equal(alarming.status, 'alarming');
  assert.equal(alarming.alarmedAt, 3);
});

test('stop and alarm acknowledgement are terminal transitions', () => {
  const trip = createTrip({ mode: 'distance', radiusMeters: 250, distanceMeters: 1, soundEnabled: true, vibrationEnabled: true });
  const alarming = reduceTrip(trip, { type: 'location', sample: { latitude: 0, longitude: 0.01, timestamp: Date.now() } });
  assert.equal(alarming.status, 'alarming');
  assert.equal(reduceTrip(alarming, { type: 'alarm-stopped' }).status, 'completed');
  assert.equal(reduceTrip(alarming, { type: 'stop' }).status, 'stopped');
});
