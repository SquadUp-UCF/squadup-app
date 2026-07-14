// src/app/(auth)/profile-setup.tsx
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { SportPicker } from '@/components/ui/sport-picker';
import { PrimaryButton } from '@/components/ui/primary-button';
import { updateProfile, checkUsernameAvailable } from '@/services/users';
import { isValidUsername } from '@/utils/validation';
import { useAuthFlow } from '@/contexts/auth-flow-context';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type Availability = 'checking' | 'available' | 'taken' | null;

export default function ProfileSetupScreen() {
  const { reset } = useAuthFlow();
  const { user, updateUser } = useSession();

  const [username, setUsername] = useState('');
  const [sport, setSport] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced live availability check, mirrors ProfileSetup.jsx. Only ever
  // setState from within the async callback, and derive "checking" below —
  // that keeps the effect itself free of synchronous setState calls.
  const [checkResult, setCheckResult] = useState<{ name: string; available: boolean } | null>(null);
  useEffect(() => {
    const name = username.trim();
    if (name.length < 3) return;
    const t = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(name);
      setCheckResult({ name, available: isAvailable });
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const trimmedUsername = username.trim();
  const availability: Availability =
    trimmedUsername.length < 3
      ? null
      : checkResult && checkResult.name === trimmedUsername
        ? checkResult.available
          ? 'available'
          : 'taken'
        : 'checking';

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to pick a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    setError('');

    if (!isValidUsername(username)) {
      setError('Username must be 3-30 characters');
      return;
    }
    if (availability === 'taken') {
      setError('That username is already taken');
      return;
    }
    if (!sport) {
      setError('Pick a sport');
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = user?.id ?? '';
      await updateProfile(userId, { username, preferred_positions: { [sport]: '' } });
      if (avatarUri) {
        await updateUser({ profile_picture: avatarUri });
      }
      await updateUser({ username, preferred_positions: { [sport]: '' } });
      reset(); // signup flow is complete — clear the shared email/token
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = username.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.head}>
        <Text style={styles.heading}>Personalize your account</Text>
        <Text style={styles.subtext}>Pick a username and your main sport to get started.</Text>
      </View>

      <View style={styles.avatarField}>
        <Text style={styles.label}>Profile picture (optional)</Text>
        <Pressable style={styles.avatarRow} onPress={handlePickAvatar}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View>
            <Text style={styles.avatarUploadTitle}>{avatarUri ? 'Change photo' : 'Upload a photo'}</Text>
            <Text style={styles.avatarUploadSub}>PNG or JPG</Text>
          </View>
        </Pressable>
      </View>

      <View>
        <TextField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        {username.trim().length >= 3 && availability && (
          <View style={styles.indicatorRow}>
            <View style={[styles.indicatorDot, availability === 'available' && styles.indicatorDotMet]} />
            <Text style={styles.indicatorText}>
              {availability === 'checking'
                ? 'Checking…'
                : availability === 'available'
                  ? 'Username is available'
                  : 'Username is taken'}
            </Text>
          </View>
        )}
      </View>

      <View>
        <Text style={styles.label}>Main sport</Text>
        <SportPicker value={sport} onChange={setSport} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Finish" loading={isSubmitting} onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  head: { gap: 4, marginBottom: spacing.sm },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  label: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  avatarField: { gap: 0 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: fonts.headingBold, fontSize: fontSizes.xl, color: colors.green },
  avatarUploadTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  avatarUploadSub: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  indicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  indicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a90000' },
  indicatorDotMet: { backgroundColor: '#22c55e' },
  indicatorText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
});
