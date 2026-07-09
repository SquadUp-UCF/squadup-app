// game cards
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Game } from '@/types/game';
import { formatGameDateTime, activePlayerCount } from '@/utils/format';

type GameCardProps = {
  game: Game;
  onPress?: () => void;
};

export function GameCard({ game, onPress }: GameCardProps) {
  const playerCount = activePlayerCount(game);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Placeholder for the banner image — photo_url is a relative path meant
          to be combined with the API's base URL later */}
      <View style={styles.bannerPlaceholder}>
        <Text style={styles.bannerText}>{game.sport}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{game.sport}</Text>
        </View>

        <Text style={styles.location}>{game.location}</Text>

        <View style={styles.row}>
          <Text style={styles.meta}>{formatGameDateTime(game.start_time)}</Text>
          <Text style={styles.meta}>
            {playerCount} / {game.max_players} Players
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  bannerPlaceholder: {
    height: 140,
    backgroundColor: '#2F6B3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  info: { padding: 12, gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#333' },
  location: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 13, color: '#666' },
});