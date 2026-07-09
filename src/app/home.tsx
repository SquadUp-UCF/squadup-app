// main feed
import { useCallback, useState } from 'react';
import { View, StyleSheet, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { GameCard } from '@/components/games/game-card';
import { discoverGames } from '@/services/games';
import type { Game } from '@/types/game';

export default function HomeScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Re-runs every time this screen comes back into focus (not just on first
  // mount) — so returning from Post Game picks up the newly created game.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      discoverGames().then((data) => {
        setGames(data);
        setIsLoading(false);
      });
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ Squad-Up</Text>
        <Pressable style={styles.postButton} onPress={() => router.push('/post-game')}>
          <Text style={styles.postButtonText}>+ Post a game</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={games}
          keyExtractor={(game) => game.id}
          renderItem={({ item }) => <GameCard game={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F4' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  logo: { fontSize: 20, fontWeight: '700' },
  postButton: { backgroundColor: '#2F6B3C', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  postButtonText: { color: '#fff', fontWeight: '600' },
  loading: { marginTop: 40 },
  list: { padding: 16 },
});