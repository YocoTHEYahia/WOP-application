import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Coordinate } from "../domain/geo";

export interface PlacePrediction {
  placeId: string;
  description: string;
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
  };
  coordinate?: Coordinate;
  properties?: any;
}

interface Props {
  onSelectPlace: (place: PlacePrediction) => void;
  onCoordinateSelect: (coordinate: Coordinate) => void;
  placeholder?: string;
  language?: string;
  countryCodes?: string;
}

const PHOTON_API_URL = "https://photon.komoot.io/api/";
const SESSION_TOKEN = Math.random().toString(36).substring(2, 15);

export const PhotonAutocomplete: React.FC<Props> = ({
  onSelectPlace,
  onCoordinateSelect,
  placeholder = "Search an address or place",
  language = "ar",
  countryCodes = "eg",
}) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPredictions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "5",
        lang: language,
        country: countryCodes,
        osm_tag: "place,amenity,shop,tourism,highway,building",
        layer: "address,venue,street,way",
      });

      const url = `${PHOTON_API_URL}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const formatted = data.features.map((feature: any) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          const mainText =
            props.name ||
            props.street ||
            props.city ||
            props.village ||
            "Unnamed location";
          const secondaryParts = [
            props.street,
            props.city || props.village || props.town,
            props.state,
            props.country,
          ].filter(Boolean);

          return {
            placeId: `photon_${feature.properties.osm_id || Math.random().toString(36).substring(7)}`,
            description: `${mainText}, ${secondaryParts.join(", ")}`,
            structuredFormatting: {
              mainText,
              secondaryText: secondaryParts.join(", "),
            },
            coordinate: {
              latitude: coords[1],
              longitude: coords[0],
            },
            properties: props,
          };
        });
        setPredictions(formatted);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error("[WOP] Photon autocomplete error:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 200);
  };

  const handlePlacePress = (place: PlacePrediction) => {
    setInputValue(place.description);
    setPredictions([]);
    inputRef.current?.blur();
    onSelectPlace(place);

    if (place.coordinate) {
      onCoordinateSelect(place.coordinate);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#97A4BB"
          value={inputValue}
          onChangeText={handleTextChange}
          onFocus={() => fetchPredictions(inputValue)}
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color="#70E1C1"
            style={styles.loading}
          />
        )}
      </View>

      {predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            renderItem={({ item }) => (
              <Pressable
                style={styles.predictionItem}
                onPress={() => handlePlacePress(item)}
                hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              >
                <Text style={styles.predictionMain}>
                  {item.structuredFormatting?.mainText || item.description}
                </Text>
                {item.structuredFormatting?.secondaryText && (
                  <Text style={styles.predictionSecondary}>
                    {item.structuredFormatting.secondaryText}
                  </Text>
                )}
              </Pressable>
            )}
            contentContainerStyle={styles.predictionsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121C2D",
    borderColor: "#26354C",
    borderRadius: 14,
    borderWidth: 1,
  },
  loading: { marginLeft: 8 },
  predictionItem: {
    borderTopColor: "#26354C",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  predictionMain: { color: "#F6F8FC", fontSize: 15, fontWeight: "600" },
  predictionSecondary: { color: "#97A4BB", fontSize: 12, marginTop: 2 },
  predictionsContainer: {
    backgroundColor: "#121C2D",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderColor: "#26354C",
    borderTopWidth: 0,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 56,
    zIndex: 10,
  },
  predictionsList: { paddingBottom: 8 },
  searchBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchIcon: { color: "#97A4BB", fontSize: 18 },
  searchInput: {
    backgroundColor: "transparent",
    color: "#F6F8FC",
    flex: 1,
    fontSize: 16,
  },
});
