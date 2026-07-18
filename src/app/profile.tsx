// Modal-presented profile screen, opened from home's account menu. Mirrors
// squadup-front's ProfileModal.jsx: tabbed "Edit settings" / "Games".
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SportIcon, availableSports, sportLabel } from '@/components/ui/sport-icon';
import { SkillPickerModal } from '@/components/games/skill-picker-modal';
import { Feather } from '@expo/vector-icons';
import { updateProfile, uploadAvatar, getSavedGames, getPlayerProfile } from '@/services/users';
import { getMyGames } from '@/services/games';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { Game } from '@/types/game';
import type { PlayerProfile } from '@/types/user';

type Tab = 'settings' | 'games';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [favoriteSports, setFavoriteSports] = useState<Record<string, string>>(user?.preferred_positions || {});
  const [activeSkillSport, setActiveSkillSport] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [joinedGames, setJoinedGames] = useState<Game[]>([]);
  const [createdGames, setCreatedGames] = useState<Game[]>([]);
  const [savedGames, setSavedGames] = useState<Game[]>([]);
  // Derived from `gamesLoaded` rather than a separate boolean, so the effect
  // below never needs a synchronous setState call at the top of its body.
  const [gamesLoaded, setGamesLoaded] = useState(false);
  const gamesLoading = activeTab === 'games' && !gamesLoaded;

  const [stats, setStats] = useState<PlayerProfile | null>(null);
  useEffect(() => {
    if (!user) return;
    let active = true;
    getPlayerProfile(user.id).then((p) => {
      if (active) setStats(p);
    });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'games' || !user) return;
    Promise.all([
      getMyGames(user.id, 'playing'),
      getMyGames(user.id, 'hosting'),
      getSavedGames().catch(() => [] as Game[]),
    ]).then(([playing, hosting, saved]) => {
      setJoinedGames(playing);
      setCreatedGames(hosting);
      setSavedGames(saved);
      setGamesLoaded(true);
    });
  }, [activeTab, user]);

  async function handlePickAvatar() {
    if (!user) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('Photo library access is needed to pick a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(user.id, result.assets[0].uri);
      await updateUser({ profile_picture: updated.profile_picture });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!user) return;
    setAvatarUploading(true);
    try {
      await uploadAvatar(user.id, null);
      await updateUser({ profile_picture: null });
    } finally {
      setAvatarUploading(false);
    }
  }

  function pickSkillLevel(level: string) {
    if (!activeSkillSport) return;
    setFavoriteSports((prev) => ({ ...prev, [activeSkillSport]: level }));
    setActiveSkillSport(null);
  }

  function removeFavorite(sport: string) {
    setFavoriteSports((prev) => {
      const next = { ...prev };
      delete next[sport];
      return next;
    });
  }

  async function handleSave() {
    if (!user) return;
    setMessage('');

    if (username.trim().length < 3 || username.trim().length > 30) {
      setMessage('Username must be 3-30 characters');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        preferred_positions: favoriteSports,
      });
      await updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        preferred_positions: favoriteSports,
      });
      setMessage('Profile updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.dismissAll();
    router.replace('/');
  }

  const initial = (firstName || user?.username || '?').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit profile</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, activeTab === 'settings' && styles.tabActive]} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Edit settings</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'games' && styles.tabActive]} onPress={() => setActiveTab('games')}>
          <Text style={[styles.tabLabel, activeTab === 'games' && styles.tabLabelActive]}>Games</Text>
        </Pressable>
      </View>

      {activeTab === 'settings' ? (
        <View style={styles.body}>
          <View style={styles.avatarRow}>
            <Pressable style={styles.avatar} onPress={handlePickAvatar} disabled={avatarUploading}>
              {user?.profile_picture ? (
                <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </Pressable>
            <View style={styles.avatarActions}>
              <Pressable onPress={handlePickAvatar} disabled={avatarUploading}>
                <Text style={styles.linkBtn}>Change profile photo</Text>
              </Pressable>
              {user?.profile_picture && (
                <Pressable onPress={handleRemoveAvatar} disabled={avatarUploading}>
                  <Text style={[styles.linkBtn, styles.linkBtnDanger]}>Remove photo</Text>
                </Pressable>
              )}
            </View>
          </View>

          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.games_joined}</Text>
                <Text style={styles.statLabel}>Played</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stats.games_created}</Text>
                <Text style={styles.statLabel}>Hosted</Text>
              </View>
              <View style={styles.stat}>
                <View style={styles.statValueRow}>
                  <Feather name="star" size={14} color={colors.green} />
                  <Text style={styles.statValue}>{stats.reputation.toFixed(1)}</Text>
                </View>
                <Text style={styles.statLabel}>Reputation</Text>
              </View>
            </View>
          )}

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <TextField label="First name" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.nameField}>
              <TextField label="Last name" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />

          <View>
            <Text style={styles.label}>Favorite sports</Text>
            <View style={styles.sportGrid}>
              {availableSports.map((sport) => {
                const skill = favoriteSports[sport];
                const isFavorite = Boolean(skill);
                return (
                  <Pressable
                    key={sport}
                    style={[styles.sportChip, isFavorite && styles.sportChipActive]}
                    onPress={() => setActiveSkillSport(sport)}
                  >
                    <SportIcon sport={sport} size={14} color={isFavorite ? colors.white : colors.green} />
                    <Text style={[styles.sportChipLabel, isFavorite && styles.sportChipLabelActive]}>{sportLabel(sport)}</Text>
                    {isFavorite && <Text style={styles.sportChipSkill}>{skill}</Text>}
                    {isFavorite && (
                      <Text style={styles.sportChipRemove} onPress={() => removeFavorite(sport)}>
                        ×
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <PrimaryButton label="Save changes" loading={saving} onPress={handleSave} />

          <Pressable style={styles.expandRow} onPress={() => router.push('/change-password')}>
            <Text style={styles.expandRowLabel}>Update password</Text>
            <Text style={styles.expandRowChevron}>›</Text>
          </Pressable>

          <Pressable style={styles.expandRow} onPress={handleLogout}>
            <Text style={[styles.expandRowLabel, styles.logoutLabel]}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.label}>Games joined</Text>
          <GameStrip games={joinedGames} loading={gamesLoading} emptyLabel="No games joined yet." />

          <Text style={styles.label}>Games created</Text>
          <GameStrip games={createdGames} loading={gamesLoading} emptyLabel="No games created yet." />

          <Text style={styles.label}>Games saved</Text>
          <GameStrip games={savedGames} loading={gamesLoading} emptyLabel="No saved games yet." />
        </View>
      )}

      <SkillPickerModal
        sport={activeSkillSport}
        currentSkill={activeSkillSport ? favoriteSports[activeSkillSport] : undefined}
        onPick={pickSkillLevel}
        onClose={() => setActiveSkillSport(null)}
      />
    </ScrollView>
  );
}

function GameStrip({ games, loading, emptyLabel }: { games: Game[]; loading: boolean; emptyLabel: string }) {
  if (loading) return <Text style={styles.stripStatus}>Loading…</Text>;
  if (!games.length) return <Text style={styles.stripStatus}>{emptyLabel}</Text>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={{ gap: spacing.sm }}>
      {games.map((game) => (
        <Pressable key={game.id} style={styles.stripCard} onPress={() => router.push(`/game/${game.id}`)}>
          <View style={styles.stripSport}>
            <SportIcon sport={game.sport} size={13} color={colors.green} />
            <Text style={styles.stripSportLabel}>{sportLabel(game.sport)}</Text>
          </View>
          <Text style={styles.stripLocation} numberOfLines={1}>
            {game.location}
          </Text>
          <Text style={styles.stripMeta}>
            {new Date(game.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.xxl, color: colors.text },
  close: { fontSize: 28, color: colors.muted },
  tabs: { flexDirection: 'row', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.green },
  tabLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.muted },
  tabLabelActive: { color: colors.green, fontFamily: fonts.bodyBold },
  body: { gap: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: fontSizes.xxl, color: colors.green },
  avatarActions: { gap: 4 },
  linkBtn: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  linkBtnDanger: { color: colors.statusCancelled.color },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  nameField: { flex: 1 },
  label: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sportChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  sportChipLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  sportChipLabelActive: { color: colors.white, fontFamily: fonts.bodyBold },
  sportChipSkill: { fontFamily: fonts.body, fontSize: 10, color: colors.white, opacity: 0.85 },
  sportChipRemove: { color: colors.white, fontSize: fontSizes.md, marginLeft: 2 },
  message: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.text, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radii.sm },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  expandRowLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text },
  expandRowChevron: { fontSize: fontSizes.xl, color: colors.muted },
  logoutLabel: { color: colors.statusCancelled.color },
  stripStatus: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted, marginBottom: spacing.md },
  strip: { marginBottom: spacing.md },
  stripCard: {
    width: 160,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  stripSport: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stripSportLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs, color: colors.green, textTransform: 'capitalize' },
  stripLocation: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  stripMeta: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
});
