import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLocked, user, loading, initialized, operationLoading } = useAuth();

  // This is a traffic light page. 
  // The actual redirection is handled by NavigationGuard in the root _layout.tsx.
  // We just show a loader here to prevent seeing "blank" content during transitions.
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

