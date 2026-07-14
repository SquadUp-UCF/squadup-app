// top level organization of app
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { SessionProvider } from '@/contexts/session-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SessionProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen
          name="post-game"
          options={{ presentation: 'modal', title: 'Post a Game' }}
        />
        <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="change-password" options={{ title: 'Update Password' }} />
        <Stack.Screen name="game/[id]" options={{ headerShown: false }} />
      </Stack>
    </SessionProvider>
  );
}
