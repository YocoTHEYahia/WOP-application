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
}

interface Props {
  onSelectPlace: (place: PlacePrediction) => void;
  onCoordinateSelect: (coordinate: Coordinate) => void;
  apiKey: string;
  placeholder?: string;
}

const SESSION_TOKEN = Math.random().toString(36).substring(2, 15);

export const GooglePlacesAutocomplete: React.FC<Props> = ({
  onSelectPlace,
  onCoordinateSelect,
  apiKey,
  placeholder = "Search an address or place",
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
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&sessiontoken=${SESSION_TOKEN}&types=geocode|establishment|point_of_interest`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        setPredictions(
          data.predictions.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            structuredFormatting: p.structured_formatting,
          })),
        );
      } else if (data.status !== "ZERO_RESULTS") {
        console.warn(
          "[WOP] Places API error:",
          data.status,
          data.error_message,
        );
        setPredictions([]);
      }
    } catch (error) {
      console.error("[WOP] Places autocomplete fetch error:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 250);
  };

  const handlePlacePress = async (place: PlacePrediction) => {
    setInputValue(place.description);
    setPredictions([]);
    inputRef.current?.blur();
    onSelectPlace(place);

    try {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.placeId}&fields=geometry&key=${apiKey}&sessiontoken=${SESSION_TOKEN}`;
      const response = await fetch(detailUrl);
      const data = await response.json();
      if (data.status === "OK" && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        onCoordinateSelect({ latitude: lat, longitude: lng });
      }
    } catch (error) {
      console.error("[WOP] Place details fetch error:", error);
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
