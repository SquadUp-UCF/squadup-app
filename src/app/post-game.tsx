// Create / edit a game. Collects sport, a map pin, time, roster size, target
// skill level, the host's own position, and (on create) initial guest players.
import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { SportPicker } from '@/components/ui/sport-picker';
import { availableSports } from '@/components/ui/sport-icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Dropdown } from '@/components/ui/dropdown';
import { GameBanner } from '@/components/games/game-banner';
import { LocationMapPicker, type Coordinate } from '@/components/ui/location-map-picker';
import { createGame, getGame, updateGame } from '@/services/games';
import { positionsForSport } from '@/constants/positions';
import { isFutureDate } from '@/utils/validation';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

// UCF main campus — where the map opens and the default pin sits until moved.
const UCF_CAMPUS: Coordinate = { latitude: 28.6024, longitude: -81.2001 };

const SKILLS: { value: 'all' | 'beginner' | 'intermediate' | 'pro'; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'pro', label: 'Pro' },
];

function defaultStartTime(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// iOS bottom sheet that pins a reachable "Done" button above the inline spinner
// picker (otherwise Done sits wherever the form happens to scroll to).
function PickerSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerModalWrap}>
        <Pressable style={styles.pickerBackdrop} onPress={onClose} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.pickerBody}>{children}</View>
        </View>
      </View>
    </Modal>
  );
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
  const [coordinate, setCoordinate] = useState<Coordinate>(UCF_CAMPUS);
  const [startDate, setStartDate] = useState<Date>(defaultStartTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [minPlayers, setMinPlayers] = useState('2');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [skillLevel, setSkillLevel] = useState<'all' | 'beginner' | 'intermediate' | 'pro'>('all');
  const [hostPosition, setHostPosition] = useState('');
  const [players, setPlayers] = useState<{ name: string; position?: string }[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
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
      setSkillLevel((game.skill_level as typeof skillLevel) ?? 'all');
      if (game.latitude != null && game.longitude != null) {
        setCoordinate({ latitude: game.latitude, longitude: game.longitude });
      }
      setLoadingExisting(false);
    });
  }, [gameId]);

  // On iOS the spinner is inline and stays open (a Done button closes it), so we
  // never hide it from onChange — that's what made it snap shut mid-scroll.
  // Android's picker is a dialog that dismisses itself, so we clear our flag.
  function onChangeDate(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selected) {
      const updated = new Date(startDate);
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartDate(updated);
    }
    if (Platform.OS !== 'ios') setShowDatePicker(false);
  }

  function onChangeTime(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (selected) {
      const updated = new Date(startDate);
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartDate(updated);
    }
    if (Platform.OS !== 'ios') setShowTimePicker(false);
  }

  function selectSport(value: string) {
    setSport(value);
    setShowOther(false);
    // Positions are sport-specific — clear any pending picks.
    setHostPosition('');
    setPlayerPosition('');
  }

  const effectiveSport = showOther ? customSport : sport;
  const sportPositions = positionsForSport(showOther ? '' : sport);
  // The sport's stock banner, shown as a non-editable preview.
  const bannerPhoto = sport && !showOther ? `/sports/${sport}.jpg` : null;

  function addPlayer() {
    const name = playerName.trim();
    if (!name) return;
    setPlayers((prev) => [...prev, { name, position: playerPosition || undefined }]);
    setPlayerName('');
    setPlayerPosition('');
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

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
    if (!isEdit && 1 + players.length > max) {
      setError(`Too many players for a max roster of ${max}.`);
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
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        skill_level: skillLevel,
      };
      if (isEdit && gameId) {
        await updateGame(gameId, input);
      } else {
        await createGame(
          {
            ...input,
            players: players.length > 0 ? players : undefined,
            host_position: hostPosition || undefined,
          },
          user?.id ?? '',
        );
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.banner}>
        <GameBanner sport={effectiveSport} photoUrl={bannerPhoto} iconSize={48} style={StyleSheet.absoluteFill} />
      </View>

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

      <Text style={styles.label}>Pin the spot</Text>
      <LocationMapPicker value={coordinate} onChange={setCoordinate} />

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

      {Platform.OS === 'ios' ? (
        <>
          <PickerSheet visible={showDatePicker} onClose={() => setShowDatePicker(false)}>
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={onChangeDate}
            />
          </PickerSheet>
          <PickerSheet visible={showTimePicker} onClose={() => setShowTimePicker(false)}>
            <DateTimePicker value={startDate} mode="time" display="spinner" onChange={onChangeTime} />
          </PickerSheet>
        </>
      ) : (
        <>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onChangeDate}
            />
          )}
          {showTimePicker && (
            <DateTimePicker value={startDate} mode="time" display="default" onChange={onChangeTime} />
          )}
        </>
      )}

      <View style={styles.row}>
        <View style={styles.half}>
          <TextField label="Min players" value={minPlayers} onChangeText={setMinPlayers} keyboardType="number-pad" />
        </View>
        <View style={styles.half}>
          <TextField label="Max players" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
        </View>
      </View>

      <Text style={styles.label}>Skill level</Text>
      <View style={styles.chipRow}>
        {SKILLS.map((s) => (
          <Chip key={s.value} label={s.label} selected={skillLevel === s.value} onPress={() => setSkillLevel(s.value)} />
        ))}
      </View>

      {!isEdit && sportPositions.length > 0 && (
        <>
          <Text style={styles.label}>Your position (optional)</Text>
          <Dropdown
            value={hostPosition}
            options={sportPositions}
            onChange={setHostPosition}
            placeholder="Select a position"
            noneLabel="No position"
          />
        </>
      )}

      {!isEdit && (
        <>
          <Text style={styles.label}>Add players (optional)</Text>
          <Text style={styles.subtle}>Pre-add people who are coming — they don’t need an account.</Text>
          <TextInput
            style={styles.playerInput}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Player name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addPlayer}
          />
          {sportPositions.length > 0 && (
            <Dropdown
              value={playerPosition}
              options={sportPositions}
              onChange={setPlayerPosition}
              placeholder="Their position (optional)"
              noneLabel="No position"
            />
          )}
          <Pressable style={styles.addPlayerBtn} onPress={addPlayer}>
            <Text style={styles.addPlayerBtnText}>Add player</Text>
          </Pressable>
          {players.map((player, index) => (
            <View key={`${player.name}-${index}`} style={styles.playerRow}>
              <Text style={styles.playerName}>
                {player.name}
                {player.position ? <Text style={styles.playerPos}>{`  ·  ${player.position}`}</Text> : null}
              </Text>
              <Pressable onPress={() => removePlayer(index)} hitSlop={8}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label={isEdit ? 'Save changes' : 'Post a game'} loading={isSubmitting} onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  subtle: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, marginTop: -spacing.xs },
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
  pickerModalWrap: { flex: 1, justifyContent: 'flex-end' },
  pickerBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,43,24,0.35)' },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerBody: { alignItems: 'center' },
  pickerDoneText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.green },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  playerInput: {
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
  addPlayerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addPlayerBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  playerName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text },
  playerPos: { fontFamily: fonts.bodyBold, color: colors.green },
  removeText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.statusCancelled.color },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
});
