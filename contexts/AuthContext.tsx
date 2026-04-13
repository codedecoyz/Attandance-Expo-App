import { useAuthActions } from '@convex-dev/auth/react';
import { ConvexHttpClient } from 'convex/browser';
import { useConvexAuth } from 'convex/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../convex/_generated/api';
import type { AuthUser, LoginCredentials } from '../types/models';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const httpClient = new ConvexHttpClient(convexUrl);

interface AuthContextType {
  user: AuthUser | null;
  userRole: 'faculty' | 'student' | 'admin' | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<'faculty' | 'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
      return;
    }

    if (isAuthenticated) {
      fetchUserDetails();
    } else {
      setUser(null);
      setUserRole(null);
      setLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  const fetchUserDetails = async () => {
    try {
      // First, ensure user record is linked/created
      await httpClient.mutation(api.users.storeUser);

      // Then fetch user details
      const userData = await httpClient.query(api.users.currentUser);

      if (userData) {
        setUser({
          id: userData._id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role as 'faculty' | 'student' | 'admin',
        });
        setUserRole(userData.role as 'faculty' | 'student' | 'admin');
      } else {
        console.warn('[Auth] User record not found');
        setUser(null);
        setUserRole(null);
      }
    } catch (err) {
      console.error('[Auth] Error fetching user details:', err);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: LoginCredentials): Promise<{ error?: string }> => {
    try {
      console.log('[Auth] Signing in:', credentials.email);
      try {
        // Try sign-in first (existing account)
        await convexSignIn('password', {
          email: credentials.email,
          password: credentials.password,
          flow: 'signIn',
        });
      } catch (signInError: any) {
        // If account doesn't exist, try sign-up (fresh DB after migration)
        console.log('[Auth] Account not found, attempting sign-up...');
        await convexSignIn('password', {
          email: credentials.email,
          password: credentials.password,
          flow: 'signUp',
        });
      }
      // Auth state change will trigger useEffect -> fetchUserDetails
      return {};
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await convexSignOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    // Password reset is not yet implemented with Convex Auth
    console.warn('[Auth] Password reset not yet implemented');
    return { error: 'Password reset is not yet available' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
