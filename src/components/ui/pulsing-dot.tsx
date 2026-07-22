// A live-indicator dot with a soft pulsing halo — mirrors the web app's
// pulsating "LIVE" marker. Uses React Native's Animated (like
// notification-toast) rather than reanimated, to match the rest of the app.
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type PulsingDotProps = {
  color?: string;
  size?: number;
};

export function PulsingDot({ color = '#ff5555', size = 8 }: PulsingDotProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  // The halo grows out from the dot and fades — a single radar-style ping,
  // looped — while the solid core stays put.
  const ringScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const ringOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}
