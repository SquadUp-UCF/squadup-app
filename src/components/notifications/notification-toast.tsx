// The live banner: when a notification arrives while the app is open, it slides
// down over whatever screen is showing. Rendered once, above the router stack.
// Tapping it goes where the notification points; it auto-dismisses otherwise.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { NotificationIcon } from '@/components/notifications/notification-icon';
import { useNotifications } from '@/contexts/notifications-context';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

const VISIBLE_MS = 4500;
const SLIDE_MS = 260;

export function NotificationToast() {
  const { liveNotification, dismissLive, markRead } = useNotifications();
  const insets = useSafeAreaInsets();
  // Starts fully off-screen; measured against a generous banner height so the
  // slide clears the notch on every device. Held in state rather than a ref
  // because the transform reads it during render.
  const [offset] = useState(() => new Animated.Value(-200));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!liveNotification) return;

    Animated.timing(offset, {
      toValue: 0,
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      Animated.timing(offset, {
        toValue: -200,
        duration: SLIDE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Only advance the queue if the slide-out actually ran to completion —
        // an interrupted animation means a newer toast already took over.
        if (finished) dismissLive();
      });
    }, VISIBLE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [liveNotification, offset, dismissLive]);

  if (!liveNotification) return null;

  function handlePress() {
    const notification = liveNotification!;
    dismissLive();
    // A rating prompt has no game screen to open — send it to the centre, where
    // the rating can be completed.
    if (notification.type === 'rate_teammates' || !notification.gameId) {
      router.push('/notifications');
      return;
    }
    markRead(notification.id).catch(() => {});
    router.push(`/game/${notification.gameId}`);
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + spacing.sm, transform: [{ translateY: offset }] },
      ]}
      // Only the banner itself should be tappable — the rest of the overlay
      // must let touches through to the screen underneath.
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={handlePress}
      >
        <NotificationIcon type={liveNotification.type} size={36} />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {liveNotification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {liveNotification.body}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    // Lifts the banner off the screen behind it on both platforms.
    shadowColor: colors.greenDeep,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardPressed: { opacity: 0.85 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.muted },
});
