// @ts-nocheck
import { AuthContextType, SendOTPResult, AuthResult, LogoutResult, SignUpResult, GoogleSignInResult } from '../template/auth/types';
import { authService } from '../services/supabaseService';
import { profileService } from '../services/profileService';
import { configManager } from '../template/core/config';
import { useAuthContext } from '../contexts/AuthContext';

export function useAuth(): AuthContextType {
  return useAuthContext();
}
