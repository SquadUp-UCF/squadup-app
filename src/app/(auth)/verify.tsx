// verify screen 
// for now, fake code is sent (123456) handled in auth.ts
import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { verifyCode, resendCode } from '@/services/auth';
import { useAuthFlow } from '@/contexts/auth-flow-context';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyScreen() {
  const { email } = useAuthFlow();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  // Ticks the cooldown down once per second. Re-runs whenever secondsLeft
  // changes (which is every tick) — but exits immediately once it hits 0,
  // so no interval is left running once the cooldown is over.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      await verifyCode(email, code);
      router.push('/profile-setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    setError('');
    try {
      await resendCode(email);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError('Could not resend code');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Verify your email</Text>
      <Text style={styles.subtext}>We sent a one-time code to {email}. Enter it below.</Text>

      <TextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoCorrect={false}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>

      <Pressable onPress={handleResend} disabled={secondsLeft > 0}>
        <Text style={[styles.link, secondsLeft > 0 && styles.linkDisabled]}>
          {secondsLeft > 0 ? `Resend code (${secondsLeft}s)` : 'Resend code'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  heading: { fontSize: 28, fontWeight: '700' },
  subtext: { fontSize: 14, color: '#666' },
  error: { color: 'crimson' },
  button: { backgroundColor: '#2F6B3C', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2F6B3C' },
  linkDisabled: { color: '#999' },
});