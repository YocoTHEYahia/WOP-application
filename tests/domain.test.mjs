import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, hasTraveledDistance, isInsideRadius, isPlausibleSample } from '../dist-domain/src/domain/geo.js';
import { createTrip, reduceTrip } from '../dist-domain/src/domain/trip.js';

test('distance is approximately zero for the same point', () => {
  assert.ok(distanceMeters({ latitude: 30, longitude: 31 }, { latitude: 30, longitude: 31 }) < 0.01);
});

test('distance is approximately 111 km per latitude degree', () => {
  const distance = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
  assert.ok(distance > 110_000 && distance < 112_000);
});

test('arrival radius respects reported GPS accuracy', () => {
  const point = { latitude: 30, longitude: 31 };
  assert.equal(isInsideRadius(point, point, 250, 50), true);
  assert.equal(isInsideRadius(point, point, 250, 500), false);
});

test('distance trigger uses a positive threshold', () => {
  assert.equal(hasTraveledDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.1 }, 1_000), true);
  assert.equal(hasTraveledDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.001 }, 1_000), false);
});

test('implausible GPS jumps are rejected', () => {
  const previous = { latitude: 30, longitude: 31, timestamp: 1_000, accuracyMeters: 5 };
  const next = { latitude: 31, longitude: 31, timestamp: 2_000, accuracyMeters: 5 };
  assert.equal(isPlausibleSample(previous, next), false);
});

test('arrival trip transitions from arming to tracking and alarm', () => {
  const destination = { id: 'd1', label: 'Home', coordinate: { latitude: 30, longitude: 31 }, createdAt: 1 };
  const trip = createTrip({ mode: 'arrival', destination, radiusMeters: 250, distanceMeters: 5_000, soundEnabled: true, vibrationEnabled: true }, 1);
  const tracking = reduceTrip(trip, { type: 'location', sample: { latitude: 29.99, longitude: 31, timestamp: 2_000, accuracyMeters: 5 } });
  assert.equal(tracking.status, 'tracking');
  const alarming = reduceTrip(tracking, { type: 'location', sample: { latitude: 30, longitude: 31, timestamp: 40_000, accuracyMeters: 5 } });
  assert.equal(alarming.status, 'alarming');
  assert.equal(alarming.alarmedAt, 40_000);
});

test('stop and alarm acknowledgement are terminal transitions', () => {
  const trip = createTrip({ mode: 'distance', radiusMeters: 250, distanceMeters: 1, soundEnabled: true, vibrationEnabled: true }, 1_000);
  const tracking = reduceTrip(trip, { type: 'location', sample: { latitude: 0, longitude: 0, timestamp: 2_000 } });
  const alarming = reduceTrip(tracking, { type: 'location', sample: { latitude: 0, longitude: 0.01, timestamp: 20_000 } });
  assert.equal(alarming.status, 'alarming');
  assert.equal(reduceTrip(alarming, { type: 'alarm-stopped' }).status, 'completed');
  assert.equal(reduceTrip(alarming, { type: 'stop' }).status, 'stopped');
});
