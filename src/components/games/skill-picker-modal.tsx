// Mirrors squadup-front's ProfileModal.jsx skill-level popover — shown when a
// favorite sport chip is tapped, to set/change its skill label.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { sportLabel } from '@/components/ui/sport-icon';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Pro'];

type SkillPickerModalProps = {
  sport: string | null;
  currentSkill?: string;
  onPick: (level: string) => void;
  onClose: () => void;
};

export function SkillPickerModal({ sport, currentSkill, onPick, onClose }: SkillPickerModalProps) {
  return (
    <Modal visible={Boolean(sport)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{sport ? sportLabel(sport) : ''}</Text>
          <Text style={styles.message}>Pick a skill level.</Text>

          <View style={styles.options}>
            {SKILL_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[styles.option, currentSkill === level && styles.optionChosen]}
                onPress={() => onPick(level)}
              >
                <Text style={[styles.optionLabel, currentSkill === level && styles.optionLabelChosen]}>{level}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13,43,24,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text, textTransform: 'capitalize' },
  message: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted },
  options: { gap: spacing.sm, marginVertical: spacing.sm },
  option: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionChosen: { backgroundColor: colors.green, borderColor: colors.green },
  optionLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  optionLabelChosen: { color: colors.white },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted },
});
