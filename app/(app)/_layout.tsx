import { Drawer } from 'expo-router/drawer';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../constants/theme';

function DrawerContent() {
  const { user, logout, lock } = useAuth();

  return (
    <View style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Avatar uri={user?.avatar} size={80} />
        <Text style={styles.drawerUsername}>{user?.username}</Text>
        <Text style={styles.drawerEmail}>{user?.email}</Text>
      </View>

      <View style={styles.drawerMenu}>
        <TouchableOpacity style={styles.drawerItem}>
          <Ionicons name="person-outline" size={24} color={colors.text.primary} />
          <Text style={styles.drawerItemText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={lock}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.text.primary} />
          <Text style={styles.drawerItemText}>Lock App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[styles.drawerItemText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated, loading, operationLoading } = useAuth();

  return (
    <Drawer
      drawerContent={DrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.black,
          borderRightWidth: 1,
          borderRightColor: colors.border.subtle,
        },
      }}
    >
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: spacing.xxl,
  },
  drawerHeader: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  drawerUsername: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  drawerEmail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  drawerMenu: {
    paddingTop: spacing.lg,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  drawerItemText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginLeft: spacing.md,
    fontWeight: typography.weights.medium,
  },
});
