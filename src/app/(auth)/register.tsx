// register/signup screen (register-verify-setup-home)
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Link } from 'expo-router';
import { TextField } from '@/components/ui/text-field';
import { PasswordChecklist } from '@/components/ui/password-checklist';
import { PrimaryButton } from '@/components/ui/primary-button';
import { register, sendVerificationCode } from '@/services/auth';
import { isUcfEmail, PASSWORD_REGEX } from '@/utils/validation';
import { useAuthFlow } from '@/contexts/auth-flow-context';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { setEmail: setFlowEmail, setToken } = useAuthFlow();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subtext}>Join thousands of players near you.</Text>
        </View>

        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} placeholder="Marcus" />
          </View>
          <View style={styles.nameField}>
            <TextField label="Last name" value={lastName} onChangeText={setLastName} placeholder="Reed" />
          </View>
        </View>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ab123456@ucf.edu"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField label="Password" value={password} onChangeText={setPassword} isPassword />
        <TextField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword />
        <PasswordChecklist password={password} confirmPassword={confirmPassword} />

        <Checkbox checked={agreedToTerms} onToggle={() => setAgreedToTerms((v) => !v)} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Create Account" loading={isSubmitting} onPress={handleSubmit} />

        <Link href="/login" style={styles.link}>
          Already have an account? <Text style={styles.linkStrong}>Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <View style={styles.termsRow}>
      <Text onPress={onToggle} style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? '✓' : ''}
      </Text>
      <Text style={styles.termsText} onPress={onToggle}>
        I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  head: { gap: 4, marginBottom: spacing.sm },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  nameField: { flex: 1 },
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
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.xs },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    lineHeight: 18,
    color: colors.white,
    overflow: 'hidden',
  },
  checkboxChecked: { backgroundColor: colors.green, borderColor: colors.green },
  termsText: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
  termsLink: { fontFamily: fonts.bodyBold, color: colors.green },
});
