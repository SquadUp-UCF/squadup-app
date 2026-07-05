// register/signup screen (register-verify-setup-home)
import { useState } from 'react';
import { View, StyleSheet, Pressable, Text, ActivityIndicator, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PasswordChecklist } from '@/components/ui/password-checklist';
import { register, sendVerificationCode } from '@/services/auth';
import { isUcfEmail, PASSWORD_REGEX } from '@/utils/validation';
import { useAuthFlow } from '@/contexts/auth-flow-context';

export default function RegisterScreen() {
  const { setEmail: setFlowEmail, setToken } = useAuthFlow();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');

    if (!isUcfEmail(email)) {
      setError('You must use a valid ucf.edu email to register');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password does not meet the requirements below');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { token } = await register({ firstName, lastName, email, password });
      await sendVerificationCode(email);

      // Hand off to the shared flow state, then move to the next screen.
      setFlowEmail(email);
      setToken(token);
      router.push('/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Register</Text>

      <TextField label="First name" value={firstName} onChangeText={setFirstName} />
      <TextField label="Last name" value={lastName} onChangeText={setLastName} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@ucf.edu"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextField
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <PasswordChecklist password={password} confirmPassword={confirmPassword} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </Pressable>

      <Link href="/login" style={styles.link}>
        Have an account? Log in
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 12 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  error: { color: 'crimson' },
  button: { backgroundColor: '#2F6B3C', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', color: '#2F6B3C' },
});