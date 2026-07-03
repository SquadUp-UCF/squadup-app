import { Stack } from 'expo-router';
import { AuthFlowProvider } from '@/contexts/auth-flow-context';

export default function AuthLayout() {
  return (
    <AuthFlowProvider>
      <Stack>
        <Stack.Screen name="login" options={{ title: 'Log In' }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="verify" options={{ title: 'Verify Email' }} />
        <Stack.Screen name="profile-setup" options={{ title: 'Set Up Profile' }} />
      </Stack>
    </AuthFlowProvider>
  );
}