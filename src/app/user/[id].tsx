// Read-only public profile for another player, opened from a game's roster.
// Shows their stats — reputation, games played, games hosted — plus per-sport
// skill levels.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getPlayerProfile } from '@/services/users';
import { SportIcon, sportLabel } from '@/components/ui/sport-icon';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import type { PlayerProfile } from '@/types/user';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = loadedId !== id;

  useEffect(() => {
    if (!id) return;
    getPlayerProfile(id).then((p) => {
      setProfile(p);
      setLoadedId(id);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Could not load this profile.</Text>
      </View>
    );
  }

  const initial = (profile.first_name || profile.username || '?').charAt(0).toUpperCase();
  const skills = Object.entries(profile.preferred_positions ?? {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {profile.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.name}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={String(profile.games_joined)} label="Games played" />
        <Stat value={String(profile.games_created)} label="Games hosted" />
        <Stat value={profile.reputation.toFixed(1)} label="Reputation" icon="star" />
      </View>

      {skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sports</Text>
          {skills.map(([sport, skill]) => (
            <View key={sport} style={styles.skillRow}>
              <SportIcon sport={sport} size={16} color={colors.green} />
              <Text style={styles.skillSport}>{sportLabel(sport)}</Text>
              {skill ? <Text style={styles.skillLevel}>{skill}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: 'star' }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        {icon === 'star' && <Feather name="star" size={16} color={colors.green} />}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  error: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.danger },
  headerCard: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: fontSizes.display, color: colors.green },
  name: { fontFamily: fonts.heading, fontSize: fontSizes.xxl, color: colors.text },
  username: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  statLabel: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
  section: { gap: spacing.sm },
  sectionLabel: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  skillSport: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text, flex: 1 },
  skillLevel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
});
