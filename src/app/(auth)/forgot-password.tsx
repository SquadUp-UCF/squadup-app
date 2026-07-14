// Mirrors squadup-front's ForgotPassword.jsx — collects the email and "sends"
// a reset link (mocked; there's no real email delivery or deep-link handling
// in this phase, see squadup-app README/plan notes).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { forgotPassword } from '@/services/auth';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setMessage('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setMessage('If that email exists, a reset link has been sent.');
    } catch {
      setMessage('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.heading}>Reset your password</Text>
          <Text style={styles.subtext}>
            {"Enter your UCF email and we'll send you a link to reset your password."}
          </Text>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ab123456@ucf.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <PrimaryButton label="Send reset link" loading={submitting} onPress={handleSubmit} />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text onPress={() => router.back()} style={styles.link}>
          Back to log in
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  head: { gap: 4 },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
  },
  link: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.green },
});
