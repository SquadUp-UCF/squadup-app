// password checker logic for strong password
import { StyleSheet, Text, View } from 'react-native';
import { passwordChecks } from '@/utils/validation';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

type PasswordChecklistProps = {
  password: string;
  confirmPassword: string;
};

export function PasswordChecklist({ password, confirmPassword }: PasswordChecklistProps) {
  const checks = passwordChecks(password);
  const matches = confirmPassword.length > 0 && confirmPassword === password;

  const items = [
    { met: checks.hasLength, label: '8–20 characters' },
    { met: checks.hasUpper, label: '1 uppercase letter' },
    { met: checks.hasLower, label: '1 lowercase letter' },
    { met: checks.hasNumber, label: '1 number' },
    { met: checks.hasSpecial, label: '1 special character' },
    { met: matches, label: matches ? 'Passwords match' : 'Passwords do not match yet' },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.dot, item.met && styles.dotMet]} />
          <Text style={styles.rowText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4, marginTop: -2, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#a90000' },
  dotMet: { backgroundColor: '#22c55e' },
  rowText: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted },
});
