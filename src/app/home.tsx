// main feed
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { GameCard } from '@/components/games/game-card';
import { ConfirmModal } from '@/components/games/confirm-modal';
import { JoinPartySizeModal } from '@/components/games/join-party-size-modal';
import { FeedControls, type ViewMode, type SortKey, type SkillFilter } from '@/components/games/feed-controls';
import { GamesMap } from '@/components/games/games-map';
import { Logo } from '@/components/ui/logo';
import { discoverGames, deleteGame, joinGame, leaveGame } from '@/services/games';
import { useSession } from '@/contexts/session-context';
import { activeCount } from '@/utils/games';
import { distanceKm } from '@/utils/geo';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';

export default function HomeScreen() {
  const { user, logout } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [joinTarget, setJoinTarget] = useState<Game | null>(null);
  const [joinError, setJoinError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Game | null>(null);

  // View toggle + filters + sort (applied client-side over the fetched list).
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [sportFilter, setSportFilter] = useState(''); // '' = all sports
  const [skillFilter, setSkillFilter] = useState<SkillFilter | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceNote, setDistanceNote] = useState<string | null>(null);

  const loadGames = useCallback(() => {
    return discoverGames().then((data) => setGames(data));
  }, []);

  async function ensureLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDistanceNote('Location is off — turn it on to sort by distance.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setDistanceNote(null);
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      setDistanceNote('Could not get your location.');
    }
  }

  function handleSort(next: SortKey) {
    setSortBy(next);
    if (next === 'distance' && !userLocation) ensureLocation();
  }

  const visibleGames = useMemo(() => {
    let list = games;
    if (sportFilter) list = list.filter((g) => g.sport === sportFilter);
    if (skillFilter !== null) list = list.filter((g) => (g.skill_level ?? 'all') === skillFilter);

    const sorted = [...list];
    if (sortBy === 'players') {
      sorted.sort((a, b) => activeCount(b) - activeCount(a));
    } else if (sortBy === 'distance' && userLocation) {
      const dist = (g: Game) =>
        g.latitude != null && g.longitude != null
          ? distanceKm(userLocation, { latitude: g.latitude, longitude: g.longitude })
          : Infinity;
      sorted.sort((a, b) => dist(a) - dist(b));
    } else {
      const recency = (g: Game) => new Date(g.createdAt ?? g.start_time).getTime();
      sorted.sort((a, b) => recency(b) - recency(a));
    }
    return sorted;
  }, [games, sportFilter, skillFilter, sortBy, userLocation]);

  const hasFilters = sportFilter !== '' || skillFilter !== null;

  // Re-runs every time this screen comes back into focus (not just on first
  // mount) — so returning from Post Game picks up the newly created game.
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadGames().finally(() => setIsLoading(false));
    }, [loadGames])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }

  async function handleJoinConfirmed(partySize: number) {
    if (!joinTarget || !user) return;
    setJoinError('');
    setJoiningId(joinTarget.id);
    try {
      await joinGame(joinTarget.id, user.id, partySize);
      await loadGames();
      setJoinTarget(null);
    } catch {
      setJoinError('Could not join the game.');
    } finally {
      setJoiningId(null);
    }
  }

  async function handleLeave(game: Game) {
    if (!user) return;
    setLeavingId(game.id);
    try {
      await leaveGame(game.id, user.id);
      await loadGames();
    } finally {
      setLeavingId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await deleteGame(confirmDelete.id);
      await loadGames();
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  async function handleLogout() {
    setShowAccountMenu(false);
    await logout();
    router.replace('/');
  }

  const initial = (user?.username || '?').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Logo size={32} />
          <Text style={styles.brandName}>Squad-Up</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.avatar} onPress={() => setShowAccountMenu(true)}>
            <Text style={styles.avatarText}>{initial}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE - UCF verified only</Text>
        </View>
        <Text style={styles.heroTitle}>Welcome{user?.username ? `, ${user.username}` : ''}</Text>
        <Text style={styles.heroSubtitle}>Tap a game to join, or post your own.</Text>
      </View>

      <FeedControls
        viewMode={viewMode}
        onViewMode={setViewMode}
        sport={sportFilter}
        onSport={setSportFilter}
        skill={skillFilter}
        onSkill={setSkillFilter}
        sort={sortBy}
        onSort={handleSort}
        distanceNote={distanceNote}
      />

      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loading}>Loading games…</Text>
        ) : viewMode === 'map' ? (
          <GamesMap games={visibleGames} onSelect={(id) => router.push(`/game/${id}`)} />
        ) : visibleGames.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{hasFilters ? 'No games match your filters' : 'No games yet'}</Text>
            <Text style={styles.emptySub}>
              {hasFilters ? 'Try widening your filters.' : 'Be the first — hit "Post a game" to host one.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={visibleGames}
            keyExtractor={(game) => game.id}
            renderItem={({ item }) => (
              <GameCard
                game={item}
                currentUserId={user?.id}
                onPress={() => router.push(`/game/${item.id}`)}
                onJoin={(game) => {
                  setJoinError('');
                  setJoinTarget(game);
                }}
                joiningId={joiningId}
                onLeave={handleLeave}
                leavingId={leavingId}
                onEdit={(game) => router.push({ pathname: '/post-game', params: { gameId: game.id } })}
                onDelete={setConfirmDelete}
                deletingId={deletingId}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.green} />}
          />
        )}
      </View>

      <View style={styles.createWrap} pointerEvents="box-none">
        <Pressable style={styles.createButton} onPress={() => router.push('/post-game')}>
          <Text style={styles.createButtonText}>Create Game</Text>
        </Pressable>
      </View>

      <JoinPartySizeModal
        game={joinTarget}
        busy={joiningId === joinTarget?.id}
        error={joinError}
        onConfirm={handleJoinConfirmed}
        onClose={() => setJoinTarget(null)}
      />

      <ConfirmModal
        visible={Boolean(confirmDelete)}
        title="Delete this game?"
        message={
          confirmDelete
            ? `Your ${confirmDelete.sport} game at ${confirmDelete.location} will be permanently removed. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deletingId === confirmDelete?.id}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setConfirmDelete(null)}
      />

      <Modal visible={showAccountMenu} transparent animationType="fade" onRequestClose={() => setShowAccountMenu(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setShowAccountMenu(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowAccountMenu(false);
                router.push('/profile');
              }}
            >
              <Text style={styles.menuItemLabel}>Profile</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemLabel, styles.menuItemDanger]}>Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F4' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandName: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postButton: { backgroundColor: colors.green, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill },
  postButtonText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: fontSizes.sm },
  hero: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.greenDeep,
    gap: 6,
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5555' },
  liveBadgeText: { color: colors.greenAccent, fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  heroTitle: { color: colors.white, fontFamily: fonts.heading, fontSize: fontSizes.xxl },
  heroSubtitle: { color: colors.greenAccent, fontFamily: fonts.body, fontSize: fontSizes.md },
  content: { flex: 1, marginTop: spacing.sm },
  loading: { marginTop: 40, textAlign: 'center', fontFamily: fonts.body, color: colors.muted },
  empty: { alignItems: 'center', marginTop: 60, gap: 4, paddingHorizontal: spacing.xl },
  emptyTitle: { fontFamily: fonts.headingBold, fontSize: fontSizes.lg, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, textAlign: 'center' },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: 96 },
  createWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
  createButton: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  createButtonText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: fontSizes.lg },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(13,43,24,0.3)' },
  menu: {
    position: 'absolute',
    top: 96,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  menuItemLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text },
  menuItemDanger: { color: colors.statusCancelled.color },
});
