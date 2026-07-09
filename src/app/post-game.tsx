// Pop up screen for creating game lsitings
import { useState } from 'react';
import { View, StyleSheet, Text, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextField } from '@/components/ui/text-field';
import { SportPicker } from '@/components/ui/sport-picker';
import { createGame } from '@/services/games';
import { isFutureDate } from '@/utils/validation';

function defaultStartTime(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

export default function PostGameScreen() {
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(defaultStartTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [minPlayers, setMinPlayers] = useState('2');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit() {
    setError('');

    if (!sport) {
      setError('Pick a sport');
      return;
    }
    if (!location.trim()) {
      setError('Location is required');
      return;
    }
    if (!isFutureDate(startDate)) {
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
      await createGame({
        sport,
        location,
        description: description.trim() || undefined,
        start_time: startDate.toISOString(),
        min_players: min,
        max_players: max,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Sport</Text>
      <SportPicker value={sport} onChange={setSport} />

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

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post a game</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: { fontSize: 16 },
  error: { color: 'crimson' },
  button: { backgroundColor: '#2F6B3C', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});