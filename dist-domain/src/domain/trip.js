"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrip = createTrip;
exports.reduceTrip = reduceTrip;
const geo_js_1 = require("./geo.js");
function createTrip(config, now = Date.now()) {
    return {
        id: `trip_${now}`,
        startedAt: now,
        status: "arming",
        config,
        traveledMeters: 0,
    };
}
function reduceTrip(trip, event) {
    if (event.type === "reset")
        return { ...trip, status: "idle", errorMessage: undefined };
    if (event.type === "stop")
        return { ...trip, status: "stopped" };
    if (event.type === "alarm-stopped") {
        return trip.status === "alarming" ? { ...trip, status: "completed" } : trip;
    }
    if (event.type === "permission-denied") {
        return { ...trip, status: "error", errorMessage: event.message };
    }
    if (trip.status === "alarming" ||
        trip.status === "completed" ||
        trip.status === "stopped")
        return trip;
    const { sample } = event;
    if (!(0, geo_js_1.isPlausibleSample)(trip.lastSample, sample))
        return trip;
    const startCoordinate = trip.startCoordinate ?? sample;
    const traveledMeters = Math.max(trip.traveledMeters, (0, geo_js_1.distanceMeters)(startCoordinate, sample));
    const destination = trip.config.destination;
    const shouldAlarm = trip.config.mode === "arrival"
        ? Boolean(destination &&
            (0, geo_js_1.isInsideRadius)(sample, destination.coordinate, trip.config.radiusMeters, sample.accuracyMeters))
        : (0, geo_js_1.hasTraveledDistance)(startCoordinate, sample, trip.config.distanceMeters);
    return {
        ...trip,
        status: shouldAlarm ? "alarming" : "tracking",
        startCoordinate,
        lastSample: sample,
        traveledMeters,
        alarmedAt: shouldAlarm
            ? (trip.alarmedAt ?? sample.timestamp)
            : trip.alarmedAt,
    };
}
