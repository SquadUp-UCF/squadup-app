// Web fallback for the coordinate picker — react-native-maps has no web build,
// so on web latitude/longitude are entered manually. Same props as native.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes, radii } from '@/constants/theme';

export type Coordinate = { latitude: number; longitude: number };

type Props = {
  value: Coordinate;
  onChange: (coord: Coordinate) => void;
};

export function LocationMapPicker({ value, onChange }: Props) {
  const [lat, setLat] = useState(String(value.latitude));
  const [lng, setLng] = useState(String(value.longitude));

  function commit(nextLat: string, nextLng: string) {
    const parsedLat = Number.parseFloat(nextLat);
    const parsedLng = Number.parseFloat(nextLng);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      onChange({ latitude: parsedLat, longitude: parsedLng });
    }
  }

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={lat}
            onChangeText={(text) => {
              setLat(text);
              commit(text, lng);
            }}
            keyboardType="numbers-and-punctuation"
            placeholder="28.6024"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={lng}
            onChangeText={(text) => {
              setLng(text);
              commit(lat, text);
            }}
            keyboardType="numbers-and-punctuation"
            placeholder="-81.2001"
          />
        </View>
      </View>
      <Text style={styles.hint}>Map selection is available in the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.body,
  },
  hint: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, marginTop: 6 },
});
