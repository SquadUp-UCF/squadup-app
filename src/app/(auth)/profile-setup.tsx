// src/app/(auth)/profile-setup.tsx
import { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { SportPicker } from '@/components/ui/sport-picker';
import { updateProfile } from '@/services/users';
import { isValidUsername } from '@/utils/validation';
import { useAuthFlow } from '@/contexts/auth-flow-context';

export default function ProfileSetupScreen() {
  const { token, reset } = useAuthFlow();

  const [username, setUsername] = useState('');
  const [sport, setSport] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');

    if (!isValidUsername(username)) {
      setError('Username must be 3-30 characters');
      return;
    }
    if (!sport) {
      setError('Pick a sport');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(token ?? '', { username, sport });
      reset(); // signup flow is complete — clear the shared email/token
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Personalize your account</Text>

      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Preferred sport</Text>
      <SportPicker value={sport} onChange={setSport} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Finish</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  error: { color: 'crimson' },
  button: { backgroundColor: '#2F6B3C', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});