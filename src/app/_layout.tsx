// top level organization of app
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { SessionProvider } from '@/contexts/session-context';
import { SavedGamesProvider } from '@/contexts/saved-games-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { NotificationToast } from '@/components/notifications/notification-toast';

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
    // The toast is a sibling of the navigator so it can float over every screen;
    // the explicit SafeAreaProvider is what gives it the top inset out there,
    // outside the navigator's own safe-area context.
    //
    // GestureHandlerRootView wraps everything because swipe-to-delete in the
    // notification centre is a gesture-handler gesture, and those are inert on
    // Android without a root view above them.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SessionProvider>
          <SavedGamesProvider>
            <NotificationsProvider>
              <View style={styles.root}>
                <Stack screenOptions={{ headerBackTitle: 'Back' }}>
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
                  <Stack.Screen name="user/[id]" options={{ title: 'Profile' }} />
                  <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
                </Stack>
                <NotificationToast />
              </View>
            </NotificationsProvider>
          </SavedGamesProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
