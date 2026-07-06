// login screen (login to app or be taken to register)
import { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { login } from '@/services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      const { token } = await login(email, password);
      // TODO: once we have app-wide auth state, store `token` there and
      // navigate into the main app. For now, just confirm it worked.
      console.log('Logged in, token:', token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Log In</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@ucf.edu"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </Pressable>

      <Link href="/register" style={styles.link}>
        No account? Register
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  error: { color: 'crimson' },
  button: { backgroundColor: '#2F6B3C', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2F6B3C' },
});