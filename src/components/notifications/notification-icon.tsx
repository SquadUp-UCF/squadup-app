// The per-type glyph shown at the head of a notification row and in the toast.
// Shared so the two surfaces can never drift apart.
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii } from '@/constants/theme';
import type { NotificationType } from '@/types/notification';

type IconSpec = { name: React.ComponentProps<typeof Feather>['name']; color: string; bg: string };

const ICONS: Record<NotificationType, IconSpec> = {
  game_cancelled: { name: 'x-circle', color: colors.statusCancelled.color, bg: colors.statusCancelled.bg },
  game_updated: { name: 'edit-3', color: colors.statusConfirmed.color, bg: colors.statusConfirmed.bg },
  game_confirmed: { name: 'check-circle', color: colors.statusConfirmed.color, bg: colors.statusConfirmed.bg },
  game_locked: { name: 'lock', color: colors.statusLocked.color, bg: colors.statusLocked.bg },
  game_filling_up: { name: 'trending-up', color: colors.fillingUp, bg: colors.statusLocked.bg },
  game_starting_soon: { name: 'clock', color: colors.green, bg: colors.statusOpen.bg },
  player_joined: { name: 'user-plus', color: colors.green, bg: colors.statusOpen.bg },
  rate_teammates: { name: 'thumbs-up', color: colors.green, bg: colors.statusOpen.bg },
  // Not rendered today — this client hides `game_completed` in favour of its
  // own rate_teammates row (see HIDDEN_NOTIFICATION_TYPES). Kept so the map
  // stays exhaustive over the API's types, and matching the web client's flag
  // so the two don't drift if it's ever shown here.
  game_completed: { name: 'flag', color: colors.muted, bg: colors.surface },
};

export function NotificationIcon({ type, size = 40 }: { type: NotificationType; size?: number }) {
  const spec = ICONS[type] ?? ICONS.game_updated;
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: spec.bg },
      ]}
    >
      <Feather name={spec.name} size={size * 0.45} color={spec.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
});
