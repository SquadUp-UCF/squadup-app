// Tap-to-place coordinate picker (native iOS/Android via react-native-maps).
// A `.web.tsx` sibling provides a manual-entry fallback, so react-native-maps
// — which has no web build — never enters the web bundle.
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { colors, fonts, fontSizes, radii } from '@/constants/theme';

export type Coordinate = { latitude: number; longitude: number };

type Props = {
  value: Coordinate;
  onChange: (coord: Coordinate) => void;
};

const DEFAULT_DELTA = 0.02;

export function LocationMapPicker({ value, onChange }: Props) {
  const region: Region = {
    latitude: value.latitude,
    longitude: value.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  return (
    <View>
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={(e) => onChange(e.nativeEvent.coordinate)}
        >
          <Marker
            draggable
            coordinate={value}
            pinColor={colors.green}
            onDragEnd={(e) => onChange(e.nativeEvent.coordinate)}
          />
        </MapView>
      </View>
      <Text style={styles.hint}>Tap the map or drag the pin to set the exact spot.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    height: 200,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  hint: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, marginTop: 6 },
});
