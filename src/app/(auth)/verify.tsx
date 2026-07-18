// verify screen
// for now, fake code is sent (123456) handled in auth.ts
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { OtpInput } from '@/components/ui/otp-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { verifyCode, resendCode } from '@/services/auth';
import { getMe } from '@/services/users';
import { setAuthToken } from '@/lib/auth-token';
import { useAuthFlow } from '@/contexts/auth-flow-context';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyScreen() {
  const { email, token } = useAuthFlow();
  const { login: setSession } = useSession();

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
      // Verification activates the account, so the registration token is now
      // usable — establish the session before continuing to profile setup.
      if (token) {
        setAuthToken(token);
        const user = await getMe();
        await setSession(token, user);
      }
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
    } catch {
      setError('Could not resend code');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <Text style={styles.heading}>Verify your email</Text>
        <Text style={styles.subtext}>
          We sent a one-time code to <Text style={styles.subtextStrong}>{email}</Text>. Enter it below.
        </Text>
      </View>

      <OtpInput value={code} onChange={setCode} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Verify" loading={isSubmitting} disabled={code.length < 6} onPress={handleSubmit} />

      <Pressable onPress={handleResend} disabled={secondsLeft > 0}>
        <Text style={styles.link}>
          {"Didn't get a code? "}
          <Text style={[styles.linkStrong, secondsLeft > 0 && styles.linkDisabled]}>
            {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  head: { gap: 4 },
  heading: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtext: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.muted },
  subtextStrong: { fontFamily: fonts.bodyBold, color: colors.text },
  error: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: 10,
  },
  link: { textAlign: 'center', fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted },
  linkStrong: { fontFamily: fonts.bodyBold, color: colors.green },
  linkDisabled: { color: colors.muted },
});
