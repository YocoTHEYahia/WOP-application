"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceMeters = distanceMeters;
exports.isInsideRadius = isInsideRadius;
exports.hasTraveledDistance = hasTraveledDistance;
exports.isPlausibleSample = isPlausibleSample;
exports.formatDistance = formatDistance;
const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees) => (degrees * Math.PI) / 180;
function distanceMeters(from, to) {
    const latitudeDelta = toRadians(to.latitude - from.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const fromLatitude = toRadians(from.latitude);
    const toLatitude = toRadians(to.latitude);
    const a = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(fromLatitude) *
            Math.cos(toLatitude) *
            Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function isInsideRadius(current, destination, radiusMeters, accuracyMeters = 0) {
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0)
        return false;
    if (accuracyMeters > Math.max(radiusMeters * 1.5, 100))
        return false;
    return distanceMeters(current, destination) <= radiusMeters;
}
function hasTraveledDistance(start, current, targetMeters) {
    return (Number.isFinite(targetMeters) &&
        targetMeters > 0 &&
        distanceMeters(start, current) >= targetMeters);
}
/** Ignore implausible GPS jumps while allowing normal pedestrian/vehicle motion. */
function isPlausibleSample(previous, next, maxSpeedMetersPerSecond = 80) {
    if (!previous)
        return true;
    const elapsedSeconds = (next.timestamp - previous.timestamp) / 1000;
    if (elapsedSeconds <= 0)
        return false;
    const maxDistance = maxSpeedMetersPerSecond * elapsedSeconds +
        (next.accuracyMeters ?? 0) +
        (previous.accuracyMeters ?? 0);
    return distanceMeters(previous, next) <= maxDistance;
}
function formatDistance(meters, unit = "km") {
    const value = unit === "mi" ? meters / 1609.344 : meters / 1000;
    if (value < 1)
        return `${Math.round(meters)} m`;
    return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}
