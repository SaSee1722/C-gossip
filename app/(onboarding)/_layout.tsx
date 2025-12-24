import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function OnboardingLayout() {
  const { isAuthenticated, loading, operationLoading } = useAuth();

  // No automatic redirect here anymore to prevent loops with /setup
  // The root index.tsx will handle the primary routing.
  // We only redirect if authenticated AND on the root index of onboarding to push them to setup/app

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="setup" />
    </Stack>
  );
}
