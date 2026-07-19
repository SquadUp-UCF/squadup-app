// Notification centre — the history behind the bell in the home header.
// Tapping a row opens the game it refers to, except "rate your teammates",
// which opens the rating prompt in place so the rating can be finished from
// here after the user tapped "Later" on it earlier.
//
// Rows are removable: swipe one left to delete it, or empty the whole list from
// the header. Deleting a rating row means "I'm not rating that game" — it drops
// the prompt for good rather than parking it.
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Feather } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { NotificationIcon } from '@/components/notifications/notification-icon';
import { RatingModal } from '@/components/games/rating-modal';
import { ConfirmModal } from '@/components/games/confirm-modal';
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
    removeNotification,
    clearAll,
    pendingRatings,
    clearRating,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  // The focus effect must not re-subscribe when these change identity: its
  // cleanup marks everything read, which updates the context, which would hand
  // back new callbacks, which would re-run the effect — an endless refresh loop.
  const actions = useRef({ refresh, markAllRead });
  useEffect(() => {
    actions.current = { refresh, markAllRead };
  }, [refresh, markAllRead]);

  // Rows stay visibly unread while the screen is open — so the user can see
  // what's new as they scroll — and are cleared on the way out, which is what
  // drops the badge on the bell.
  useFocusEffect(
    useCallback(() => {
      actions.current.refresh().catch(() => {});
      return () => {
        actions.current.markAllRead().catch(() => {});
      };
    }, []),
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

  async function handleClearAll() {
    setClearing(true);
    try {
      await clearAll();
    } finally {
      setClearing(false);
      setConfirmingClear(false);
    }
  }

  function renderRow({ item }: { item: AppNotification }) {
    return (
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        containerStyle={styles.swipeContainer}
        renderRightActions={() => (
          <Pressable
            style={styles.deleteAction}
            onPress={() => removeNotification(item.id).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel={`Delete notification: ${item.title}`}
          >
            <Feather name="trash-2" size={18} color={colors.white} />
            <Text style={styles.deleteActionLabel}>Delete</Text>
          </Pressable>
        )}
      >
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
      </ReanimatedSwipeable>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () =>
            notifications.length > 0 ? (
              <Pressable
                onPress={() => setConfirmingClear(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear all notifications"
              >
                <Text style={styles.clearAction}>Clear all</Text>
              </Pressable>
            ) : null,
        }}
      />

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

      <ConfirmModal
        visible={confirmingClear}
        title="Clear all notifications?"
        message="Your notification history will be emptied. Any teammate ratings you haven't submitted will stop being asked for."
        confirmLabel="Clear all"
        danger
        busy={clearing}
        onConfirm={handleClearAll}
        onClose={() => setConfirmingClear(false)}
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
  clearAction: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  // The swipe container owns the row's rounded corners so the red action behind
  // it is clipped to the same shape instead of squaring off the edge.
  swipeContainer: { borderRadius: radii.lg, overflow: 'hidden' },
  deleteAction: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.statusCancelled.color,
  },
  deleteActionLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.white },
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
