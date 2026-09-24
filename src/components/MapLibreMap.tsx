import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Map as MapView, type MapRef } from "@maplibre/maplibre-react-native";
import { Camera } from "@maplibre/maplibre-react-native";
import { GeoJSONSource } from "@maplibre/maplibre-react-native";
import { Layer } from "@maplibre/maplibre-react-native";

const { width, height } = Dimensions.get("window");

interface MapLibreMapProps {
  style?: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onRegionChangeComplete?: (region: any) => void;
  markerCoordinate?: { latitude: number; longitude: number } | null;
  showsUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

// OSM Liberty style - free, beautiful, no key required
const OSM_LIBERTY_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  style,
  initialRegion,
  onPress,
  onRegionChangeComplete,
  markerCoordinate,
  showsUserLocation = false,
  userLocation = null,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Convert latitudeDelta to zoom level
  const latitudeDeltaToZoom = (delta: number) => {
    return Math.log2(360 / delta) - 8;
  };

  const handleMapPress = (event: any) => {
    if (onPress && event.coordinate) {
      onPress(event.coordinate);
    }
  };

  const handleRegionChange = (event: any) => {
    if (onRegionChangeComplete && event.viewState) {
      const { center, zoom } = event.viewState;
      // Convert zoom back to latitudeDelta for compatibility
      const latitudeDelta = 360 / Math.pow(2, zoom + 8);
      onRegionChangeComplete({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta,
        longitudeDelta: latitudeDelta,
      });
    }
  };

  // Initial view state for Camera component
  const initialViewState = {
    center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
    zoom: latitudeDeltaToZoom(initialRegion.latitudeDelta),
    pitch: 0,
    bearing: 0,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapStyle={OSM_LIBERTY_STYLE}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionChange}
        onDidFinishLoadingStyle={() => setMapLoaded(true)}
      >
        <Camera
          initialViewState={
            {
              center: {
                lat: initialRegion.latitude,
                lng: initialRegion.longitude,
              },
              zoom: latitudeDeltaToZoom(initialRegion.latitudeDelta),
              pitch: 0,
              bearing: 0,
            } as any
          }
        />

        {/* Marker */}
        {markerCoordinate && (
          <GeoJSONSource
            id="marker-source"
            data={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [
                      markerCoordinate.longitude,
                      markerCoordinate.latitude,
                    ],
                  },
                  properties: {},
                },
              ],
            }}
          >
            <Layer
              id="marker-layer"
              type="symbol"
              source="marker-source"
              layout={{
                "icon-image": "marker",
                "icon-size": 1.2,
                "icon-anchor": "bottom",
                "icon-allow-overlap": true,
              }}
            />
          </GeoJSONSource>
        )}

        {/* User location accuracy circle */}
        {showsUserLocation && userLocation && (
          <GeoJSONSource
            id="user-location-source"
            data={{
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [
                      userLocation.longitude,
                      userLocation.latitude,
                    ],
                  },
                  properties: {},
                },
              ],
            }}
          >
            <Layer
              id="user-location-accuracy"
              type="circle"
              source="user-location-source"
              paint={{
                "circle-radius": 20,
                "circle-color": "#1E40AF",
                "circle-opacity": 0.15,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#1E40AF",
              }}
            />
          </GeoJSONSource>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height,
    width: width,
  },
});

export default MapLibreMap;
