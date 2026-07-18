// Web fallback for the live games map — react-native-maps has no web build, so
// on web we show a short note instead of a map. Same props as the native file.
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';

type Props = {
  games: Game[];
  onSelect: (id: string) => void;
};

export function GamesMap(_props: Props) {
  return (
    <View style={styles.container}>
      <Feather name="map" size={40} color={colors.muted} />
      <Text style={styles.text}>Map view is available in the mobile app.</Text>
      <Text style={styles.sub}>Switch to Feed View to browse games here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 6 },
  text: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, textAlign: 'center' },
});
