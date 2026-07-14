// Landing screen — mirrors squadup-front's pages/landingPage.jsx (styled with
// the shared theme instead of unstyled). Skips straight to /home if a
// persisted session already exists.
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/ui/logo';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useSession } from '@/contexts/session-context';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function LandingScreen() {
  const { token, isHydrating } = useSession();

  if (isHydrating) return null;
  if (token) return <Redirect href="/home" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Logo size={40} />
        </View>
        <Text style={styles.title}>Squad-Up</Text>
        <Text style={styles.subtitle}>
          Find pickup games near you, or post your own — UCF students only.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Log In" onPress={() => router.push('/login')} />
        <PrimaryButton label="Register" variant="outline" onPress={() => router.push('/register')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.display, color: colors.text },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { gap: spacing.md, paddingBottom: spacing.xl },
});
