// Pushed from profile's "Update password" row. Mirrors squadup-front's
// ChangePasswordPage.jsx: a successful change retires the session, same as
// web logging the user out and sending them back to the landing screen.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PasswordChecklist } from '@/components/ui/password-checklist';
import { PrimaryButton } from '@/components/ui/primary-button';
import { changePassword } from '@/services/auth';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { logout } = useSession();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      await logout();
      router.dismissAll();
      router.replace('/login');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.heading}>Update password</Text>
          <Text style={styles.subtext}>Choose a new password for your account.</Text>
        </View>

        <TextField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} isPassword />
        <TextField label="New password" value={newPassword} onChangeText={setNewPassword} isPassword />
        <TextField label="Confirm new password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} isPassword />
        <PasswordChecklist password={newPassword} confirmPassword={confirmNewPassword} />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PrimaryButton label="Update password" loading={submitting} onPress={handleSubmit} />

        <Text onPress={() => router.back()} style={styles.link}>
          Cancel
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  head: { gap: 4, marginBottom: spacing.sm },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: 10,
  },
  link: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted, marginTop: spacing.sm },
});
