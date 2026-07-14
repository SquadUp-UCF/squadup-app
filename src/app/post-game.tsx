// Pop up screen for creating/editing game listings
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { SportPicker } from '@/components/ui/sport-picker';
import { SportIcon, availableSports } from '@/components/ui/sport-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createGame, getGame, updateGame } from '@/services/games';
import { isFutureDate } from '@/utils/validation';
import { hasCustomBanner } from '@/utils/games';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

function defaultStartTime(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

export default function PostGameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();
  const isEdit = Boolean(gameId);
  const { user } = useSession();

  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [sport, setSport] = useState('');
  const [customSport, setCustomSport] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(defaultStartTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [minPlayers, setMinPlayers] = useState('2');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    getGame(gameId).then((game) => {
      if (!game) return;
      const knownSport = availableSports.includes(game.sport.toLowerCase());
      setSport(knownSport ? game.sport.toLowerCase() : 'other');
      setShowOther(!knownSport);
      if (!knownSport) setCustomSport(game.sport);
      setLocation(game.location);
      setDescription(game.description || '');
      setStartDate(new Date(game.start_time));
      setMinPlayers(String(game.min_players));
      setMaxPlayers(String(game.max_players));
      if (hasCustomBanner(game)) setBannerUri(game.photo_url);
      setLoadingExisting(false);
    });
  }, [gameId]);

  function onValueChangeDate(_event: unknown, selected?: Date) {
    setShowDatePicker(false);
    if (!selected) return;
    const updated = new Date(startDate);
    updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setStartDate(updated);
  }

  function onValueChangeTime(_event: unknown, selected?: Date) {
    setShowTimePicker(false);
    if (!selected) return;
    const updated = new Date(startDate);
    updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setStartDate(updated);
  }

  async function handlePickBanner() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to add a banner image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setBannerUri(result.assets[0].uri);
    }
  }

  function selectSport(value: string) {
    setSport(value);
    setShowOther(false);
  }

  const effectiveSport = showOther ? customSport : sport;

  async function handleSubmit() {
    setError('');

    if (!effectiveSport) {
      setError('Pick a sport');
      return;
    }
    if (!location.trim()) {
      setError('Location is required');
      return;
    }
    if (!isEdit && !isFutureDate(startDate)) {
      setError('Start time must be in the future');
      return;
    }

    const min = parseInt(minPlayers, 10);
    const max = parseInt(maxPlayers, 10);
    if (!min || !max || min < 1 || max < min) {
      setError('Check your min/max player counts');
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        sport: effectiveSport,
        location,
        description: description.trim() || undefined,
        start_time: startDate.toISOString(),
        min_players: min,
        max_players: max,
        photo_url: bannerUri || undefined,
      };
      if (isEdit && gameId) {
        await updateGame(gameId, input);
      } else {
        await createGame(input, user?.id ?? '');
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingExisting) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.banner} onPress={handlePickBanner}>
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#2F8F4E', '#1F6B3E']} style={StyleSheet.absoluteFill} />
        )}
        {!bannerUri && <SportIcon sport={effectiveSport} size={48} color="rgba(255,255,255,0.55)" />}
        <View style={styles.bannerPrompt}>
          <Text style={styles.bannerPromptText}>{bannerUri ? 'Change image' : 'Upload an image'}</Text>
        </View>
      </Pressable>

      <Text style={styles.label}>Sport</Text>
      <SportPicker value={sport} onChange={selectSport} />
      <Pressable
        style={[styles.otherChip, showOther && styles.otherChipSelected]}
        onPress={() => {
          setShowOther(true);
          setSport('other');
        }}
      >
        <Text style={[styles.otherChipText, showOther && styles.otherChipTextSelected]}>Other</Text>
      </Pressable>
      {showOther && (
        <TextField label="Custom sport" value={customSport} onChangeText={setCustomSport} placeholder="Enter a sport" />
      )}

      <TextField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. RWC Courts, UCF" />

      <TextField
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Casual pickup, all levels welcome."
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Start time</Text>
      <View style={styles.row}>
        <Pressable style={[styles.dateButton, styles.half]} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>
            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>
        <Pressable style={[styles.dateButton, styles.half]} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateButtonText}>
            {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onValueChange={onValueChangeDate}
          onDismiss={() => setShowDatePicker(false)}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={onValueChangeTime}
          onDismiss={() => setShowTimePicker(false)}
        />
      )}

      <View style={styles.row}>
        <View style={styles.half}>
          <TextField label="Min players" value={minPlayers} onChangeText={setMinPlayers} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <TextField label="Max players" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label={isEdit ? 'Save changes' : 'Post a game'} loading={isSubmitting} onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, gap: spacing.md },
  banner: {
    height: 140,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  bannerPrompt: { position: 'absolute', bottom: spacing.sm, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radii.pill },
  bannerPromptText: { color: colors.white, fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs },
  label: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted },
  otherChip: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: -spacing.xs,
  },
  otherChipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  otherChipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  otherChipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  dateButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateButtonText: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
});
