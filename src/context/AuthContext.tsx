import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { backendApi, AppUser, UserRole } from '../services/backendApi';

export type { UserRole };
export interface AppUserProfile extends AppUser {}

interface AuthContextType {
  user: AppUserProfile | null;
  profile: AppUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  canAccessControlRoom: boolean;
  userRole: UserRole;
  authError: string | null;
  clearError: () => void;
  signInGoogle: (email?: string, name?: string) => Promise<void>;
  signInYahoo: (email?: string, name?: string) => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string, role?: UserRole, inst?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string; restorationCode?: string }>;
  signOutUser: () => Promise<void>;
  setDemoUser: (role: UserRole) => Promise<void>;
  updateRole: (email: string, newRole: UserRole) => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasRole: (allowedRoles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'eduscore_tz_user_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Authoritative re-validation with backend
  const refreshAuth = useCallback(async () => {
    try {
      const current = await backendApi.getMe();
      if (current?.user) {
        setUser(current.user);
        localStorage.setItem(USER_KEY, JSON.stringify(current.user));
      } else {
        // Check if there is a local cached profile to re-authenticate with backend
        const saved = localStorage.getItem(USER_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.email) {
              const res = await backendApi.loginWithOAuth(
                (parsed.provider as any) || 'google',
                parsed.email,
                parsed.displayName,
                parsed.photoURL,
                parsed.role
              );
              setUser(res.user);
              return;
            }
          } catch (e) {
            console.warn('[AuthContext] Re-auth parsing failed:', e);
          }
        }

        // Initialize authoritative default principal account on backend
        const res = await backendApi.loginWithOAuth(
          'google',
          'deodatusmaliti2@gmail.com',
          'Super Admin Deodatus Maliti (Principal)',
          undefined,
          'admin'
        );
        setUser(res.user);
      }
    } catch (err) {
      console.warn('[AuthContext] Authoritative backend auth check note:', err);
      // Local fallback in case network is initializing
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    // 1. Cross-Tab / Cross-Window Synchronization via Storage Event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY) {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {}
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. Real-Time SSE Stream Listener for Auth & Role Changes across all remote nodes
    const unsubscribe = backendApi.subscribe((event, data) => {
      if (event === 'auth_change') {
        if (data?.action === 'LOGOUT') {
          setUser(null);
          localStorage.removeItem(USER_KEY);
        } else if (data?.action === 'ROLE_UPDATE' || data?.action === 'USER_UPDATE') {
          // If the role update applies to the current user or generally, re-fetch authoritative profile
          refreshAuth();
        } else if (data?.action === 'LOGIN' && data?.email) {
          // If another browser session logged in with the same account
          setUser((prev) => {
            if (prev && prev.email.toLowerCase() === data.email.toLowerCase() && data.role) {
              return { ...prev, role: data.role };
            }
            return prev;
          });
        }
      } else if (event === 'doc_change' && data?.collection === 'users') {
        // Authoritative backend collection was modified (e.g. from Backend Control Room)
        refreshAuth();
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unsubscribe();
    };
  }, [refreshAuth]);

  const clearError = () => setAuthError(null);

  const signInGoogle = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const email = customEmail || 'deodatusmaliti2@gmail.com';
      const name = customName || (email === 'deodatusmaliti2@gmail.com' ? 'Super Admin Deodatus Maliti' : email.split('@')[0]);
      const res = await backendApi.loginWithOAuth('google', email, name);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInYahoo = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const email = customEmail || 'educator@yahoo.com';
      const name = customName || 'Tanzanian Educator';
      const res = await backendApi.loginWithOAuth('yahoo', email, name);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setAuthError(err?.message || 'Yahoo sign-in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await backendApi.loginWithEmail(email, pass);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'teacher',
    inst: string = 'Jitegemee Secondary School'
  ) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await backendApi.registerWithEmail(email, pass, name, role, inst);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setAuthError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      return await backendApi.sendPasswordReset(email);
    } catch (err: any) {
      setAuthError(err?.message || 'Password reset failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async () => {
    setIsLoading(true);
    try {
      backendApi.logout();
      setUser(null);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoUser = async (role: UserRole) => {
    setIsLoading(true);
    try {
      // Authenticate with authoritative backend so the switch is registered across all connected browsers & devices
      const res = await backendApi.loginDemo(role);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      console.warn('[AuthContext] Demo switch fallback:', err);
      const roleNames: Record<UserRole, { name: string; email: string }> = {
        admin: { name: 'Mwl. Peter Masanja (Principal)', email: 'principal@jitegemee.ac.tz' },
        headteacher: { name: 'Mwl. Grace Mtenga (Academic Head)', email: 'academic@jitegemee.ac.tz' },
        teacher: { name: 'Mwl. Josephat Kimaro (Science Dept)', email: 'jkimaro@jitegemee.ac.tz' },
        parent: { name: 'Bw. Hassan Rashid (Parent)', email: 'hrashid@gmail.com' },
        inspector: { name: 'Dr. Neema Mushi (District Inspector)', email: 'inspector@moe.go.tz' },
      };
      const demo = roleNames[role];
      const fallbackUser: AppUserProfile = {
        uid: `demo-${role}-${Date.now()}`,
        email: demo.email,
        displayName: demo.name,
        role,
        institution: 'Jitegemee Secondary School, Dar es Salaam',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'active',
        provider: 'demo',
      };
      setUser(fallbackUser);
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (email: string, newRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await backendApi.updateUserRole(email, newRole);
      if (user && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to update user role');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const userRole: UserRole = user?.role || 'teacher';
  const isAdmin = userRole === 'admin';
  const canAccessControlRoom = isAdmin;

  const hasRole = useCallback(
    (allowedRoles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return list.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        canAccessControlRoom,
        userRole,
        authError,
        clearError,
        signInGoogle,
        signInYahoo,
        signInEmail,
        signUpEmail,
        sendPasswordReset,
        signOutUser,
        setDemoUser,
        updateRole,
        refreshAuth,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
