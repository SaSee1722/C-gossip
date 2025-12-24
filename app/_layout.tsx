import { Stack, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlertProvider } from '@/template';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatsProvider } from '../contexts/ChatsContext';
import { ConnectionsProvider } from '../contexts/ConnectionsContext';
import { StoriesProvider } from '../contexts/StoriesContext';
import { CallsProvider } from '../contexts/CallsContext';
import { useAuth } from '../hooks/useAuth';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, initialized, user, operationLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || loading || operationLoading) return;

    const inAuthGroup = segments[0] === '(onboarding)';
    const inAppGroup = segments[0] === '(app)';
    const isSetupPage = segments[1] === 'setup';

    if (!isAuthenticated) {
      // Not logged in: only allow onboarding
      if (!inAuthGroup) router.replace('/(onboarding)');
    } else {
      // Logged in: check profile completeness
      const isIdentityComplete = !!(user?.username && user?.full_name && user?.age && user?.phone && user?.gender);

      if (!isIdentityComplete) {
        // Must do setup
        if (!isSetupPage) router.replace('/(onboarding)/setup');
      } else {
        // Profile complete: go to app, UNLESS we are specifically trying to EDIT (isSetupPage)
        if (!inAppGroup && !isSetupPage) {
          router.replace('/(app)/(tabs)');
        }
      }
    }
  }, [isAuthenticated, loading, initialized, user?.id, segments, operationLoading]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <ChatsProvider>
              <ConnectionsProvider>
                <StoriesProvider>
                  <CallsProvider>
                    <NavigationGuard>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(onboarding)" />
                        <Stack.Screen name="(app)" />
                        <Stack.Screen name="lock" options={{ presentation: 'fullScreenModal' }} />
                      </Stack>
                    </NavigationGuard>
                  </CallsProvider>
                </StoriesProvider>
              </ConnectionsProvider>
            </ChatsProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
