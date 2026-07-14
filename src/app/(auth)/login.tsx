// src/app/(auth)/login.tsx
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { login } from '@/services/auth';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login: setSession } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    setIsSubmitting(true);
    try {
      const { token, user } = await login(email, password);
      await setSession(token, user);
      router.replace('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtext}>Sign in to find your next game.</Text>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ab123456@ucf.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        <View style={styles.field}>
          <TextField label="Password" value={password} onChangeText={setPassword} isPassword autoCorrect={false} spellCheck={false} />
          <Link href="/forgot-password" style={styles.forgotLink}>
            Forgot password?
          </Link>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Sign In" loading={isSubmitting} onPress={handleSubmit} />

        <Link href="/register" style={styles.link}>
          {"Don't have an account? "}
          <Text style={styles.linkStrong}>Sign up free</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  head: { gap: 4, marginBottom: spacing.sm },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  field: { gap: spacing.xs },
  forgotLink: { alignSelf: 'flex-end', fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: 10,
  },
  link: { textAlign: 'center', fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, marginTop: spacing.sm },
  linkStrong: { fontFamily: fonts.bodyBold, color: colors.green },
});
