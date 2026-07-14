// Icon-based sport picker — mirrors the SportIcon-driven chip/select UI used
// throughout squadup-front (ProfileSetup, PostGameModal, ProfileModal).
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import { SportIcon, availableSports, sportLabel } from './sport-icon';

type SportPickerProps = {
  value: string;
  onChange: (sport: string) => void;
};

export function SportPicker({ value, onChange }: SportPickerProps) {
  return (
    <View style={styles.grid}>
      {availableSports.map((sport) => {
        const isSelected = sport === value;
        return (
          <Pressable
            key={sport}
            onPress={() => onChange(sport)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <SportIcon sport={sport} size={16} color={isSelected ? colors.white : colors.green} />
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{sportLabel(sport)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
});
