// Header bell + unread badge, the entry point to the notification centre.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/contexts/notifications-context';
import { colors, fonts, fontSizes } from '@/constants/theme';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const label = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
      }
    >
      <Feather name="bell" size={20} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    // Separates the badge from the bell when they overlap.
    borderWidth: 2,
    borderColor: '#F5F9F4',
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xs - 2,
    lineHeight: fontSizes.xs,
  },
});
