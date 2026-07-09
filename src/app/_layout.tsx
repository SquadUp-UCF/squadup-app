// top level organization of app
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen
        name="post-game"
        options={{ presentation: 'modal', title: 'Post a Game' }}
      />
    </Stack>
  );
}