// Expanded view of a single game, pushed by tapping its card in the feed.
// Mirrors squadup-front's GameDetailModal.jsx: hero, roster (with skill level
// per participant), a notifications toggle, and join/leave.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router, useLocalSearchParams } from 'expo-router';
import { getGame, joinGame, leaveGame } from '@/services/games';
import { getUser } from '@/services/users';
import { SportIcon, sportLabel } from '@/components/ui/sport-icon';
import { JoinPartySizeModal } from '@/components/games/join-party-size-modal';
import { useSession } from '@/contexts/session-context';
import { activeCount, hasCustomBanner, isLive, statusMeta } from '@/utils/games';
import { formatGameDateTime } from '@/utils/format';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';
import type { UserProfile } from '@/types/user';

const NOTIFICATIONS_KEY_PREFIX = 'squadup_notifications_';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();

  const [game, setGame] = useState<Game | null>(null);
  // Derived from `loadedId` rather than a separate boolean, so the effect
  // below never needs a synchronous setState call at the top of its body.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = loadedId !== id;
  const [roster, setRoster] = useState<Record<string, UserProfile | null>>({});
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGame(id).then((data) => {
      setGame(data);
      setLoadedId(id);
    });
    SecureStore.getItemAsync(`${NOTIFICATIONS_KEY_PREFIX}${id}`).then((v) => setNotifsEnabled(v === 'true'));
  }, [id]);

  // Tracks which participant ids have already been (or are being) fetched,
  // via a ref rather than reading `roster` state — keeps this effect's
  // dependency array accurate without re-running on every roster update.
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!game) return;
    const joined = game.participants.filter((p) => p.status === 'joined');
    joined.forEach((p) => {
      if (fetchedIdsRef.current.has(p.user)) return;
      fetchedIdsRef.current.add(p.user);
      getUser(p.user).then((profile) => setRoster((prev) => ({ ...prev, [p.user]: profile })));
    });
  }, [game]);

  async function refresh() {
    if (!id) return;
    const data = await getGame(id);
    setGame(data);
  }

  async function handleJoinConfirmed(partySize: number) {
    if (!game || !user) return;
    setJoinError('');
    setJoining(true);
    try {
      await joinGame(game.id, user.id, partySize);
      await refresh();
      setJoinOpen(false);
    } catch {
      setJoinError('Could not join the game.');
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
  const joinable = !isHost && !alreadyIn && game.status !== 'locked' && game.status !== 'completed' && game.status !== 'cancelled';
  const customBanner = hasCustomBanner(game);
  const rosterEntries = game.participants.filter((p) => p.status === 'joined');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        {customBanner ? (
          <Image source={{ uri: game.photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#2F8F4E', '#1F6B3E']} style={StyleSheet.absoluteFill} />
        )}
        {!customBanner && (
          <View style={styles.heroIcon}>
            <SportIcon sport={game.sport} size={56} color="rgba(255,255,255,0.55)" />
          </View>
        )}
        <View style={[styles.heroStatus, { backgroundColor: meta.bg }]}>
          <Text style={[styles.heroStatusText, { color: meta.color }]}>{live ? 'LIVE' : meta.label}</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={[styles.sportPill]}>
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

        <View style={styles.roster}>
          <Text style={styles.rosterLabel}>Players ({rosterEntries.length})</Text>
          {rosterEntries.map((p) => {
            const profile = roster[p.user];
            const skill = profile?.preferred_positions?.[game.sport];
            return (
              <View key={p.user} style={styles.playerRow}>
                <View style={styles.playerAvatar}>
                  {profile?.profile_picture ? (
                    <Image source={{ uri: profile.profile_picture }} style={styles.playerAvatarImage} />
                  ) : (
                    <Text style={styles.playerAvatarInitial}>{(profile?.username || '?').slice(0, 2).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.playerName}>{profile?.username || 'Loading…'}</Text>
                {p.user === game.host && (
                  <View style={styles.hostBadge}>
                    <Text style={styles.hostBadgeText}>Host</Text>
                  </View>
                )}
                {skill && <Text style={styles.playerSkill}>{skill}</Text>}
              </View>
            );
          })}
        </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: spacing.xxl },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 200, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { alignItems: 'center', justifyContent: 'center' },
  heroStatus: { position: 'absolute', top: spacing.lg, left: spacing.lg, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.pill },
  heroStatusText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
  closeBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
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
  playerName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text, flex: 1 },
  hostBadge: { backgroundColor: colors.statusOpen.bg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill },
  hostBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.statusOpen.color },
  playerSkill: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
  actionBtn: { marginTop: spacing.lg, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  joinBtn: { backgroundColor: colors.green },
  joinBtnDisabled: { backgroundColor: '#E4E4E4' },
  joinLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.white },
  joinLabelDisabled: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: '#999' },
  leaveBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  leaveLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.green },
});
