// Small colored pill — mirrors squadup-front's .pl-badge, used for
// LIVE/NEW/"Filling up"/status labels.
import { StyleSheet, Text, View } from 'react-native';
import { fonts, fontSizes, radii, spacing } from '@/constants/theme';

type BadgeProps = {
  label: string;
  bg: string;
  color: string;
};

export function Badge({ label, bg, color }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xs },
});
