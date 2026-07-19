// Post-game player rating: thumbs up / thumbs down for the other registered
// players of a completed game. Shown to the host right after they finish a game,
// and to each participant when they open the app / refresh the feed until they
// submit. Submitting records the game as rated (so it stops prompting), even if
// no thumbs were chosen.
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUser } from '@/services/users';
import { sportLabel } from '@/components/ui/sport-icon';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';

type Rating = 'up' | 'down';

type Props = {
  game: Game | null;
  currentUserId?: string;
  busy?: boolean;
  onSubmit: (ratings: { user: string; value: Rating }[]) => void;
  onClose: () => void; // "Later" — dismiss without recording
};

export function RatingModal({ game, currentUserId, busy = false, onSubmit, onClose }: Props) {
  const ratees = useMemo(
    () =>
      game
        ? game.participants.filter((p) => p.user && p.status === 'joined' && p.user !== currentUserId)
        : [],
    [game, currentUserId],
  );

  const [names, setNames] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, Rating>>({});

  // Reset choices and fetch display names whenever the game changes. Keyed on
  // the game's id, not the object: polling hands back a fresh Game every 30s,
  // and reacting to that identity change would wipe the thumbs mid-selection.
  const gameId = game?.id;
  useEffect(() => {
    setRatings({});
    if (!gameId) return;
    let active = true;
    ratees.forEach((p) => {
      const uid = p.user as string;
      getUser(uid).then((profile) => {
        if (active && profile) setNames((prev) => ({ ...prev, [uid]: profile.username }));
      });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function setRating(user: string, value: Rating) {
    setRatings((prev) => (prev[user] === value ? (() => {
      const next = { ...prev };
      delete next[user];
      return next;
    })() : { ...prev, [user]: value }));
  }

  function submit() {
    onSubmit(Object.entries(ratings).map(([user, value]) => ({ user, value })));
  }

  return (
    <Modal visible={Boolean(game)} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Rate your teammates</Text>
          <Text style={styles.message}>
            {game ? `${sportLabel(game.sport)} at ${game.location}` : ''}
          </Text>

          {ratees.length === 0 ? (
            <Text style={styles.empty}>No other players to rate.</Text>
          ) : (
            <ScrollView style={styles.list} bounces={false}>
              {ratees.map((p) => {
                const uid = p.user as string;
                const choice = ratings[uid];
                return (
                  <View key={uid} style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>
                      {names[uid] || 'Player'}
                    </Text>
                    <View style={styles.thumbs}>
                      <Pressable
                        style={[styles.thumb, choice === 'up' && styles.thumbUpActive]}
                        onPress={() => setRating(uid, 'up')}
                      >
                        <Feather name="thumbs-up" size={18} color={choice === 'up' ? colors.white : colors.green} />
                      </Pressable>
                      <Pressable
                        style={[styles.thumb, choice === 'down' && styles.thumbDownActive]}
                        onPress={() => setRating(uid, 'down')}
                      >
                        <Feather
                          name="thumbs-down"
                          size={18}
                          color={choice === 'down' ? colors.white : colors.statusCancelled.color}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.laterBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.laterLabel}>Later</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={submit} disabled={busy}>
              <Text style={styles.submitLabel}>{busy ? 'Submitting…' : 'Submit'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13,43,24,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  message: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  empty: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, paddingVertical: spacing.md },
  list: { maxHeight: 320, marginVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  name: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text, flex: 1, marginRight: spacing.md },
  thumbs: { flexDirection: 'row', gap: spacing.sm },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  thumbUpActive: { backgroundColor: colors.green, borderColor: colors.green },
  thumbDownActive: { backgroundColor: colors.statusCancelled.color, borderColor: colors.statusCancelled.color },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.xs },
  laterBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  laterLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted },
  submitBtn: { backgroundColor: colors.green, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  submitLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
});
