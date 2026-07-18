// Single-select dropdown: a tappable control that opens a modal list of
// options. Dependency-free (react-native Modal), styled with the shared theme.
// `value === ''` means nothing is selected.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type DropdownProps = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string; // shown when value is ''
  noneLabel?: string; // label for the row that clears the selection
};

export function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  noneLabel = 'None',
}: DropdownProps) {
  const [open, setOpen] = useState(false);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <Pressable style={styles.control} onPress={() => setOpen(true)}>
        <Text style={[styles.controlText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <ScrollView bounces={false}>
              <Pressable style={styles.option} onPress={() => select('')}>
                <Text style={[styles.optionText, styles.optionMuted]}>{noneLabel}</Text>
              </Pressable>
              {options.map((option) => (
                <Pressable key={option} style={styles.option} onPress={() => select(option)}>
                  <Text style={[styles.optionText, option === value && styles.optionSelected]}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  controlText: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text, flexShrink: 1 },
  placeholder: { color: colors.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(13,43,24,0.35)', justifyContent: 'center', padding: spacing.xl },
  sheet: { backgroundColor: colors.white, borderRadius: radii.lg, maxHeight: '60%', overflow: 'hidden' },
  option: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.lg, color: colors.text },
  optionMuted: { color: colors.muted },
  optionSelected: { color: colors.green, fontFamily: fonts.bodyBold },
});
