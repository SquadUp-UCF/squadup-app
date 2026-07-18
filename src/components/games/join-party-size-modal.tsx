// Shown when "Join game" is tapped, before the actual join request fires. Lets
// the caller bring named guests (each with an optional, sport-specific position)
// who each take a spot on the roster — or just join solo.
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Game } from '@/types/game';
import { activeCount } from '@/utils/games';
import { Dropdown } from '@/components/ui/dropdown';
import { positionsForSport } from '@/constants/positions';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type Guest = { name: string; position?: string };

type JoinPartySizeModalProps = {
  game: Game | null;
  busy?: boolean;
  error?: string;
  onConfirm: (guests: Guest[]) => void;
  onClose: () => void;
};

export function JoinPartySizeModal({ game, busy = false, error = '', onConfirm, onClose }: JoinPartySizeModalProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');

  // You take one spot; guests take the rest.
  const remaining = game ? Math.max(0, game.max_players - activeCount(game) - 1) : 0;
  const guestSlotsLeft = remaining - guests.length;
  const sportPositions = game ? positionsForSport(game.sport.toLowerCase()) : [];

  function reset() {
    setGuests([]);
    setName('');
    setPosition('');
  }

  function addGuest() {
    const trimmed = name.trim();
    if (!trimmed || guestSlotsLeft <= 0) return;
    setGuests((prev) => [...prev, { name: trimmed, position: position || undefined }]);
    setName('');
    setPosition('');
  }

  function close() {
    reset();
    onClose();
  }

  function confirm() {
    onConfirm(guests);
  }

  return (
    <Modal visible={Boolean(game)} transparent animationType="fade" onRequestClose={busy ? undefined : close}>
      <Pressable style={styles.overlay} onPress={busy ? undefined : close}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Join game</Text>
          <Text style={styles.message}>
            Bring guests? {remaining} spot{remaining === 1 ? '' : 's'} for guests.
          </Text>

          {guests.map((g, i) => (
            <View key={`${g.name}-${i}`} style={styles.guestRow}>
              <Text style={styles.guestName}>
                {g.name}
                {g.position ? <Text style={styles.guestPos}>{`  ·  ${g.position}`}</Text> : null}
              </Text>
              <Pressable onPress={() => setGuests((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={8}>
                <Feather name="x" size={16} color={colors.statusCancelled.color} />
              </Pressable>
            </View>
          ))}

          {guestSlotsLeft > 0 && (
            <View style={styles.addBox}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Guest name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
              {sportPositions.length > 0 && (
                <Dropdown
                  value={position}
                  options={sportPositions}
                  onChange={setPosition}
                  placeholder="Position (optional)"
                  noneLabel="No position"
                />
              )}
              <Pressable style={styles.addBtn} onPress={addGuest}>
                <Text style={styles.addBtnText}>Add guest</Text>
              </Pressable>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={close} disabled={busy}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={confirm} disabled={busy}>
              <Text style={styles.confirmLabel}>
                {busy ? 'Joining…' : guests.length === 0 ? 'Join game' : `Join with ${guests.length}`}
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
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  guestName: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.md, color: colors.text },
  guestPos: { fontFamily: fonts.bodyBold, color: colors.green },
  addBox: { gap: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  addBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.sm, color: colors.green },
  error: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end', marginTop: spacing.xs },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.muted },
  confirmBtn: { backgroundColor: colors.green, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  confirmLabel: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.white },
});
