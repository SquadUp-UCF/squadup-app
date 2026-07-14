// Shown when "Join game" is tapped, before the actual join request fires —
// mirrors squadup-front's JoinPartySizeModal.jsx. Lets the caller RSVP for a
// group instead of just themselves, capped at however many spots are left.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Game } from '@/types/game';
import { activeCount } from '@/utils/games';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';
import { useState } from 'react';

type JoinPartySizeModalProps = {
  game: Game | null;
  busy?: boolean;
  error?: string;
  onConfirm: (partySize: number) => void;
  onClose: () => void;
};

export function JoinPartySizeModal({ game, busy = false, error = '', onConfirm, onClose }: JoinPartySizeModalProps) {
  const remaining = game ? Math.max(1, game.max_players - activeCount(game)) : 1;
  const [partySize, setPartySize] = useState(1);

  return (
    <Modal visible={Boolean(game)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>How many are joining?</Text>
          <Text style={styles.message}>
            Include yourself in the count. {remaining} spot{remaining === 1 ? '' : 's'} left.
          </Text>

          <View style={styles.stepper}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setPartySize((n) => Math.max(1, n - 1))}
              disabled={partySize <= 1}
            >
              <Text style={styles.stepperBtnLabel}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{partySize}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setPartySize((n) => Math.min(remaining, n + 1))}
              disabled={partySize >= remaining}
            >
              <Text style={styles.stepperBtnLabel}>+</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={() => onConfirm(partySize)} disabled={busy}>
              <Text style={styles.confirmLabel}>
                {busy ? 'Joining…' : partySize === 1 ? 'Join game' : `Join with ${partySize - 1} more`}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13,43,24,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  message: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.md },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnLabel: { fontFamily: fonts.headingBold, fontSize: fontSizes.xl, color: colors.green },
  stepperValue: { fontFamily: fonts.headingBold, fontSize: fontSizes.xxl, color: colors.text, minWidth: 32, textAlign: 'center' },
  error: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted },
  confirmBtn: { backgroundColor: colors.green, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  confirmLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
});
