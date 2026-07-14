// A small confirmation dialog, mirrors squadup-front's ConfirmModal.jsx —
// used in place of a native confirm() for destructive actions like deleting a game.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, danger && styles.confirmBtnDanger]}
              onPress={onConfirm}
              disabled={busy}
            >
              <Text style={styles.confirmLabel}>{busy ? 'Deleting…' : confirmLabel}</Text>
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
  message: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.muted, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted },
  confirmBtn: { backgroundColor: colors.green, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  confirmBtnDanger: { backgroundColor: colors.statusCancelled.color },
  confirmLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
});
