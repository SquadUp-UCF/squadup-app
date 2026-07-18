// Notification centre — the history behind the bell in the home header.
// Tapping a row opens the game it refers to, except "rate your teammates",
// which opens the rating prompt in place so the rating can be finished from
// here after the user tapped "Later" on it earlier.
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { NotificationIcon } from '@/components/notifications/notification-icon';
import { RatingModal } from '@/components/games/rating-modal';
import { useNotifications } from '@/contexts/notifications-context';
import { useSession } from '@/contexts/session-context';
import { rateGame } from '@/services/games';
import { formatRelativeTime } from '@/utils/format';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { AppNotification } from '@/types/notification';
import type { Game } from '@/types/game';

export default function NotificationsScreen() {
  const { user } = useSession();
  const {
    notifications,
    isLoading,
    refresh,
    markRead,
    markAllRead,
    pendingRatings,
    clearRating,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);

  // Rows stay visibly unread while the screen is open — so the user can see
  // what's new as they scroll — and are cleared on the way out, which is what
  // drops the badge on the bell.
  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
      return () => {
        markAllRead().catch(() => {});
      };
    }, [refresh, markAllRead]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  }

  function handlePress(notification: AppNotification) {
    if (notification.type === 'rate_teammates') {
      const game = pendingRatings.find((g) => g.id === notification.gameId);
      // Gone from the pending list means it was rated elsewhere in the
      // meantime; the next refresh drops the row.
      if (game) setRatingGame(game);
      return;
    }

    markRead(notification.id).catch(() => {});
    if (notification.gameId) router.push(`/game/${notification.gameId}`);
  }

  async function handleSubmitRatings(ratings: { user: string; value: 'up' | 'down' }[]) {
    if (!ratingGame) return;
    setRatingBusy(true);
    try {
      await rateGame(ratingGame.id, ratings);
      clearRating(ratingGame.id);
      setRatingGame(null);
    } catch {
      // Leave the modal open so the user can retry.
    } finally {
      setRatingBusy(false);
    }
  }

  function renderRow({ item }: { item: AppNotification }) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          !item.read && styles.rowUnread,
          pressed && styles.rowPressed,
        ]}
        onPress={() => handlePress(item)}
      >
        <NotificationIcon type={item.type} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowBody}>{item.body}</Text>
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt)}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContent : styles.listContent
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.emptySub}>Loading…</Text>
          ) : (
            <View style={styles.empty}>
              <NotificationIcon type="game_starting_soon" size={56} />
              <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
              <Text style={styles.emptySub}>
                Updates about games you joined show up here.
              </Text>
            </View>
          )
        }
      />

      <RatingModal
        game={ratingGame}
        currentUserId={user?.id}
        busy={ratingBusy}
        onSubmit={handleSubmitRatings}
        onClose={() => setRatingGame(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F4' },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  emptyContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowUnread: { borderColor: colors.greenAccent, backgroundColor: '#FBFEFA' },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  rowBody: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  rowMeta: { alignItems: 'flex-end', gap: spacing.xs },
  rowTime: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  empty: { alignItems: 'center', gap: spacing.sm },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.muted,
    textAlign: 'center',
  },
});
