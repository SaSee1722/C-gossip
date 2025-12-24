// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { AuthUser } from '../template/auth/types';
import { authService } from '../services/supabaseService';
import { profileService } from '../services/profileService';

interface AuthContextState {
  user: AuthUser | null;
  loading: boolean;
  operationLoading: boolean;
  initialized: boolean;
  isLocked: boolean;
  version: number;
}

interface AuthContextActions {
  setOperationLoading: (loading: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setIsLocked: (locked: boolean) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<SignUpResult>;
  logout: () => Promise<LogoutResult>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  lock: () => void;
  unlock: () => void;
}

type AuthContextType = AuthContextState & AuthContextActions & {
  isAuthenticated: boolean;
  isLocked: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    loading: true,
    operationLoading: true, // Start as true during initialization
    initialized: false,
    isLocked: false,
    version: 0,
  });

  const updateState = (updates: Partial<AuthContextState>) => {
    setState(prevState => {
      // 1. Check if user is being updated and if it's meaningful
      if (updates.user && prevState.user && updates.user.id === prevState.user.id) {
        const hasMeaningfulChange =
          updates.user.username !== prevState.user.username ||
          updates.user.full_name !== prevState.user.full_name ||
          updates.user.avatar !== prevState.user.avatar ||
          updates.user.age !== prevState.user.age ||
          updates.user.gender !== prevState.user.gender;

        if (!hasMeaningfulChange) {
          // Check if there are OTHER updates. If not, don't update anything.
          const { user, ...otherUpdates } = updates;
          if (Object.keys(otherUpdates).length === 0) return prevState;
          return { ...prevState, ...otherUpdates, version: prevState.version + 1 };
        }
      }

      // 2. Default update with version increment
      return { ...prevState, ...updates, version: prevState.version + 1 };
    });
  };

  const setOperationLoading = React.useCallback((loading: boolean) => {
    updateState({ operationLoading: loading });
  }, []);

  const setUser = React.useCallback((user: AuthUser | null) => {
    updateState({ user });
  }, []);

  const setIsLocked = React.useCallback((isLocked: boolean) => {
    updateState({ isLocked });
  }, []);

  const login = React.useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setOperationLoading(true);
    try {
      const result = await authService.signInWithPassword(email, password);
      if (result.user) updateState({ user: result.user });
      return result;
    } finally {
      setOperationLoading(false);
    }
  }, [setOperationLoading]);

  const signup = React.useCallback(async (email: string, password: string, metadata?: Record<string, any>): Promise<SignUpResult> => {
    setOperationLoading(true);
    try {
      return await authService.signUpWithPassword(email, password, metadata);
    } finally {
      setOperationLoading(false);
    }
  }, [setOperationLoading]);

  const logout = React.useCallback(async (): Promise<LogoutResult> => {
    setOperationLoading(true);
    try {
      return await authService.logout();
    } finally {
      setOperationLoading(false);
    }
  }, [setOperationLoading]);

  const refreshSession = React.useCallback(async () => {
    await authService.refreshSession();
  }, []);

  const updateProfile = React.useCallback(async (updates: Partial<AuthUser>) => {
    if (state.user) {
      const success = await profileService.updateProfile(state.user.id, updates);
      if (success) {
        updateState({ user: { ...state.user, ...updates } });
      }
    }
  }, [state.user]);

  const lock = React.useCallback(() => setIsLocked(true), [setIsLocked]);
  const unlock = React.useCallback((pin?: string) => {
    if (!state.user?.chatPin || state.user?.chatPin === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [state.user, setIsLocked]);

  const lastUserRef = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();

        if (isMounted) {
          const fingerprint = currentUser
            ? `${currentUser.id}:${currentUser.username}:${currentUser.full_name}:${currentUser.age}`
            : 'null';
          lastUserRef.current = fingerprint;

          updateState({
            user: currentUser,
            loading: false,
            initialized: true,
            operationLoading: false,
            isLocked: false
          });
        }

        authSubscription = authService.onAuthStateChange(async (authUser) => {
          if (!isMounted) return;

          const fingerprint = authUser
            ? `${authUser.id}:${authUser.username}:${authUser.full_name}:${authUser.age}`
            : 'null';

          if (fingerprint === lastUserRef.current) return;
          lastUserRef.current = fingerprint;

          updateState({ user: authUser });
        });

      } catch (error) {
        console.warn('[Template:AuthProvider] Auth initialization failed:', error);
        if (isMounted) {
          updateState({
            user: null,
            loading: false,
            initialized: true
          });
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures single execution
  const contextValue: AuthContextType = useMemo(() => ({
    ...state,
    setOperationLoading,
    setUser,
    setIsLocked,
    login,
    signup,
    logout,
    refreshSession,
    updateProfile,
    lock,
    unlock,
    isAuthenticated: !!state.user,
  }), [
    state.version,
    setOperationLoading, setUser, setIsLocked, login, signup, logout, refreshSession, updateProfile, lock, unlock
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuthContext Hook - internal use
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}