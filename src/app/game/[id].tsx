// Expanded view of a single game: hero banner, roster (with each player's
// position), join/leave, and — for the host — guest management. The caller can
// also set their own position and save the game.
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getGame,
  joinGame,
  leaveGame,
  addGuest,
  removeGuest,
  setMyPosition,
  deleteGame,
  completeGame,
  rateGame,
} from '@/services/games';
import { getUser } from '@/services/users';
import { SportIcon, sportLabel } from '@/components/ui/sport-icon';
import { GameBanner } from '@/components/games/game-banner';
import { Dropdown } from '@/components/ui/dropdown';
import { JoinPartySizeModal } from '@/components/games/join-party-size-modal';
import { ConfirmModal } from '@/components/games/confirm-modal';
import { RatingModal } from '@/components/games/rating-modal';
import { useSession } from '@/contexts/session-context';
import { useSavedGames } from '@/contexts/saved-games-context';
import { useNotifications } from '@/contexts/notifications-context';
import { positionsForSport } from '@/constants/positions';
import { activeCount, isLive, statusMeta } from '@/utils/games';
import { formatGameDateTime } from '@/utils/format';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';
import type { UserProfile } from '@/types/user';

const NOTIFICATIONS_KEY_PREFIX = 'squadup_notifications_';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const { isSaved, toggleSaved } = useSavedGames();
  // Finishing a game prompts for ratings here, but the queue itself lives in
  // the notification centre — so "Later" parks it there instead of being
  // forgotten, and a submitted rating clears it everywhere at once.
  const { refresh: refreshNotifications, dismissRating, clearRating } = useNotifications();
  const insets = useSafeAreaInsets();

  const [game, setGame] = useState<Game | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = loadedId !== id;
  const [roster, setRoster] = useState<Record<string, UserProfile | null>>({});
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPosition, setGuestPosition] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGame(id).then((data) => {
      setGame(data);
      setLoadedId(id);
    });
    SecureStore.getItemAsync(`${NOTIFICATIONS_KEY_PREFIX}${id}`).then((v) => setNotifsEnabled(v === 'true'));
  }, [id]);

  const fetchedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!game) return;
    game.participants
      .filter((p) => p.status === 'joined' && p.user)
      .forEach((p) => {
        const uid = p.user as string;
        if (fetchedIdsRef.current.has(uid)) return;
        fetchedIdsRef.current.add(uid);
        getUser(uid).then((profile) => setRoster((prev) => ({ ...prev, [uid]: profile })));
      });
  }, [game]);

  async function refresh() {
    if (!id) return;
    const data = await getGame(id);
    setGame(data);
  }

  async function handleJoinConfirmed(guests: { name: string; position?: string }[]) {
    if (!game || !user) return;
    setJoinError('');
    setJoining(true);
    try {
      await joinGame(game.id, guests);
      await refresh();
      setJoinOpen(false);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join the game.');
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!game || !user) return;
    setLeaving(true);
    try {
      await leaveGame(game.id, user.id);
      await refresh();
    } finally {
      setLeaving(false);
    }
  }

  async function handleAddGuest() {
    if (!game) return;
    const name = guestName.trim();
    if (!name) return;
    setBusy(true);
    setActionError('');
    try {
      const updated = await addGuest(game.id, { name, position: guestPosition || undefined });
      setGame(updated);
      setGuestName('');
      setGuestPosition('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not add guest');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveGuest(index: number) {
    if (!game) return;
    setBusy(true);
    setActionError('');
    try {
      const updated = await removeGuest(game.id, index);
      setGame(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove guest');
    } finally {
      setBusy(false);
    }
  }

  async function handleSetMyPosition(position: string) {
    if (!game) return;
    setBusy(true);
    setActionError('');
    try {
      const updated = await setMyPosition(game.id, position);
      setGame(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update your position');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!game) return;
    setDeleting(true);
    try {
      await deleteGame(game.id);
      setConfirmingDelete(false);
      router.back();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete game');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function handleComplete() {
    if (!game) return;
    setCompleting(true);
    setActionError('');
    try {
      const updated = await completeGame(game.id);
      setGame(updated);
      // Prompt the host to rate the other players right away.
      setRatingGame(updated);
      // Pick the freshly completed game up as a pending rating now, so
      // dismissing the prompt leaves a notification behind rather than
      // waiting on the next poll.
      refreshNotifications().catch(() => {});
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not finish the game');
    } finally {
      setCompleting(false);
    }
  }

  async function handleSubmitRatings(ratings: { user: string; value: 'up' | 'down' }[]) {
    if (!ratingGame) return;
    setRatingBusy(true);
    try {
      await rateGame(ratingGame.id, ratings);
      clearRating(ratingGame.id);
      setRatingGame(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not submit ratings');
    } finally {
      setRatingBusy(false);
    }
  }

  async function toggleNotifications() {
    const next = !notifsEnabled;
    setNotifsEnabled(next);
    await SecureStore.setItemAsync(`${NOTIFICATIONS_KEY_PREFIX}${id}`, String(next));
  }

  if (loading || !game) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  const meta = statusMeta(game);
  const live = isLive(game);
  const joined = activeCount(game);
  const isHost = Boolean(user) && game.host === user!.id;
  const alreadyIn = game.participants.some((p) => p.user === user?.id && p.status === 'joined');
  const joinable =
    !isHost && !alreadyIn && game.status !== 'locked' && game.status !== 'completed' && game.status !== 'cancelled';
  const rosterFull = joined >= game.max_players;
  const saved = isSaved(game.id);
  // Roster with original indices (needed to remove a guest by index).
  const roster_ = game.participants
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => p.status === 'joined');
  const myEntry = game.participants.find((p) => p.user === user?.id && p.status === 'joined');
  const sportPositions = positionsForSport(game.sport.toLowerCase());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <GameBanner sport={game.sport} photoUrl={game.photo_url} iconSize={56} style={StyleSheet.absoluteFill} />
        <View style={[styles.heroStatus, { top: insets.top + spacing.sm, backgroundColor: meta.bg }]}>
          <Text style={[styles.heroStatusText, { color: meta.color }]}>{live ? 'LIVE' : meta.label}</Text>
        </View>
        <View style={[styles.heroActions, { top: insets.top + spacing.sm }]}>
          {!isHost && (
            <Pressable style={styles.heroBtn} onPress={() => toggleSaved(game.id)}>
              <Feather name="heart" size={18} color={saved ? colors.fillingUp : colors.text} />
            </Pressable>
          )}
          <Pressable style={styles.heroBtn} onPress={() => router.back()}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.sportPill}>
          <SportIcon sport={game.sport} size={16} color={colors.statusOpen.color} />
          <Text style={styles.sportPillLabel}>{sportLabel(game.sport)}</Text>
        </View>

        <View style={styles.titleRow}>
          <Feather name="map-pin" size={18} color="#2F8F4E" />
          <Text style={styles.title}>{game.location}</Text>
        </View>

        {game.description ? <Text style={styles.description}>{game.description}</Text> : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={15} color={colors.muted} />
            <Text style={styles.metaText}>{formatGameDateTime(game.start_time)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={15} color={colors.muted} />
            <Text style={styles.metaText}>
              {joined} / {game.max_players} players
            </Text>
          </View>
        </View>

        <Pressable style={styles.notifBtn} onPress={toggleNotifications}>
          <Feather name={notifsEnabled ? 'bell' : 'bell-off'} size={16} color={colors.green} />
          <Text style={styles.notifBtnLabel}>{notifsEnabled ? 'Notifications on' : 'Enable notifications'}</Text>
        </Pressable>

        {isHost && (
          <View style={styles.hostActions}>
            <Pressable
              style={styles.hostBtn}
              onPress={() => router.push({ pathname: '/post-game', params: { gameId: game.id } })}
            >
              <Feather name="edit-2" size={16} color={colors.green} />
              <Text style={styles.hostBtnText}>Edit game</Text>
            </Pressable>
            <Pressable style={[styles.hostBtn, styles.hostBtnDanger]} onPress={() => setConfirmingDelete(true)}>
              <Feather name="trash-2" size={16} color={colors.statusCancelled.color} />
              <Text style={[styles.hostBtnText, styles.hostBtnTextDanger]}>Delete</Text>
            </Pressable>
          </View>
        )}

        {isHost && game.status !== 'completed' && game.status !== 'cancelled' && (
          <Pressable style={styles.finishBtn} onPress={handleComplete} disabled={completing}>
            <Feather name="check-circle" size={16} color={colors.white} />
            <Text style={styles.finishBtnText}>{completing ? 'Finishing…' : 'Mark as finished'}</Text>
          </Pressable>
        )}

        <View style={styles.roster}>
          <Text style={styles.rosterLabel}>Players ({roster_.length})</Text>
          {roster_.map(({ p, index }) => {
            const isGuest = !p.user;
            const profile = p.user ? roster[p.user] : null;
            const name = isGuest ? p.name : profile?.username || 'Loading…';
            return (
              <Pressable
                key={index}
                style={styles.playerRow}
                onPress={p.user ? () => router.push({ pathname: '/user/[id]', params: { id: p.user! } }) : undefined}
                disabled={isGuest}
              >
                <View style={styles.playerAvatar}>
                  {profile?.profile_picture ? (
                    <Image source={{ uri: profile.profile_picture }} style={styles.playerAvatarImage} />
                  ) : (
                    <Text style={styles.playerAvatarInitial}>{(name || '?').slice(0, 2).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.playerName}>{name}</Text>
                {p.user === game.host && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                )}
                {isGuest && (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>Guest</Text>
                  </View>
                )}
                {p.position ? (
                  <Text style={styles.playerPosition}>{p.position}</Text>
                ) : isGuest ? (
                  <Text style={styles.playerUndecided}>Undecided</Text>
                ) : null}
                {/* The host manages the whole roster; everyone else can take
                    back a guest they brought themselves. */}
                {isGuest && (isHost || (!!user && p.added_by === user.id)) && (
                  <Pressable
                    onPress={() => handleRemoveGuest(index)}
                    disabled={busy}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove guest ${name}`}
                  >
                    <Feather name="x" size={16} color={colors.statusCancelled.color} />
                  </Pressable>
                )}
                {!isGuest && <Feather name="chevron-right" size={16} color={colors.muted} />}
              </Pressable>
            );
          })}
        </View>

        {/* Set your own position (host or any joined player). */}
        {myEntry && sportPositions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your position</Text>
            <Dropdown
              value={myEntry.position ?? ''}
              options={sportPositions}
              onChange={handleSetMyPosition}
              placeholder="Select a position"
              noneLabel="No position"
            />
          </View>
        )}

        {/* Host: add a guest player. */}
        {isHost && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add a guest</Text>
            <TextInput
              style={styles.guestInput}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Player name"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              editable={!busy && !rosterFull}
            />
            {sportPositions.length > 0 && (
              <Dropdown
                value={guestPosition}
                options={sportPositions}
                onChange={setGuestPosition}
                placeholder="Their position (optional)"
                noneLabel="No position"
              />
            )}
            <Pressable
              style={[styles.addGuestBtn, (busy || rosterFull) && styles.addGuestBtnDisabled]}
              onPress={handleAddGuest}
              disabled={busy || rosterFull}
            >
              <Text style={styles.addGuestBtnText}>{rosterFull ? 'Roster is full' : 'Add guest'}</Text>
            </Pressable>
          </View>
        )}

        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

        {!isHost && alreadyIn && (
          <Pressable style={[styles.actionBtn, styles.leaveBtn]} onPress={handleLeave} disabled={leaving}>
            <Text style={styles.leaveLabel}>{leaving ? 'Leaving…' : "You're in — Leave"}</Text>
          </Pressable>
        )}
        {!isHost && !alreadyIn && (
          <Pressable
            style={[styles.actionBtn, joinable ? styles.joinBtn : styles.joinBtnDisabled]}
            onPress={() => setJoinOpen(true)}
            disabled={!joinable}
          >
            <Text style={joinable ? styles.joinLabel : styles.joinLabelDisabled}>
              {game.status === 'locked' ? 'Full' : 'Join game'}
            </Text>
          </Pressable>
        )}
      </View>

      <JoinPartySizeModal
        game={joinOpen ? game : null}
        busy={joining}
        error={joinError}
        onConfirm={handleJoinConfirmed}
        onClose={() => setJoinOpen(false)}
      />

      <ConfirmModal
        visible={confirmingDelete}
        title="Delete this game?"
        message={`Your ${sportLabel(game.sport)} game at ${game.location} will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />

      <RatingModal
        game={ratingGame}
        currentUserId={user?.id}
        busy={ratingBusy}
        onSubmit={handleSubmitRatings}
        onClose={() => {
          if (ratingGame) dismissRating(ratingGame.id);
          setRatingGame(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: spacing.xxl },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 200 },
  heroStatus: { position: 'absolute', left: spacing.lg, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill },
  heroStatusText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  heroActions: { position: 'absolute', right: spacing.lg, flexDirection: 'row', gap: spacing.sm },
  heroBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.xl, gap: spacing.sm },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.statusOpen.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  sportPillLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.statusOpen.color, textTransform: 'capitalize' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.xxl, color: colors.text, flexShrink: 1 },
  description: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  notifBtnLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.green },
  hostActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  hostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hostBtnDanger: { borderColor: colors.statusCancelled.color },
  hostBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  hostBtnTextDanger: { color: colors.statusCancelled.color },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.green,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  finishBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
  roster: { marginTop: spacing.md, gap: spacing.sm },
  rosterLabel: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playerAvatarImage: { width: '100%', height: '100%' },
  playerAvatarInitial: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.green },
  playerName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text, flexShrink: 1 },
  hostBadge: { backgroundColor: colors.statusOpen.bg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  hostBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.statusOpen.color },
  guestBadge: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  guestBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted },
  playerPosition: { marginLeft: 'auto', fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.green },
  playerUndecided: { marginLeft: 'auto', fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, fontStyle: 'italic' },
  section: { marginTop: spacing.md, gap: spacing.sm },
  sectionLabel: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  guestInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  inlineRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  inlineInput: { flex: 1 },
  addGuestBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addGuestBtnDisabled: { opacity: 0.5 },
  addGuestBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  errorText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.danger },
  actionBtn: { marginTop: spacing.lg, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  joinBtn: { backgroundColor: colors.green },
  joinBtnDisabled: { backgroundColor: '#E4E4E4' },
  joinLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.white },
  joinLabelDisabled: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: '#999' },
  leaveBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  leaveLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.green },
});
