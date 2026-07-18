// Live map of games (native iOS/Android via react-native-maps). Each game with
// coordinates is a pin; tapping its callout opens the game. A `.web.tsx` sibling
// provides a fallback so react-native-maps never enters the web bundle.
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { sportLabel } from '@/components/ui/sport-icon';
import { colors, radii } from '@/constants/theme';
import type { Game } from '@/types/game';

// Roughly UCF main campus — the default view when no games have coordinates.
const UCF = { latitude: 28.6024, longitude: -81.2001 };

type Props = {
  games: Game[];
  onSelect: (id: string) => void;
};

function hasCoords(g: Game): g is Game & { latitude: number; longitude: number } {
  return g.latitude != null && g.longitude != null;
}

// A region that comfortably frames all pinned games (or UCF when there are none).
function regionFor(games: Game[]): Region {
  const pts = games.filter(hasCoords);
  if (pts.length === 0) {
    return { ...UCF, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }
  const lats = pts.map((p) => p.latitude);
  const lons = pts.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.02),
    longitudeDelta: Math.max((maxLon - minLon) * 1.4, 0.02),
  };
}

export function GamesMap({ games, onSelect }: Props) {
  const pins = games.filter(hasCoords);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={regionFor(games)}>
        {pins.map((g) => (
          <Marker
            key={g.id}
            coordinate={{ latitude: g.latitude, longitude: g.longitude }}
            pinColor={colors.green}
            title={`${sportLabel(g.sport)} · ${g.location}`}
            description="Tap for details"
            onCalloutPress={() => onSelect(g.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, margin: 16, borderRadius: radii.lg, overflow: 'hidden' },
});
