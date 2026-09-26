import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LeaveBalance, Role } from '../types';
import { authApi, leaveApi } from '../api';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithPopup,
  googleProvider,
  appleProvider,
  sendEmailVerification,
} from '../config/firebase';

interface AuthContextType {
  user: UserProfile | null;
  balances: LeaveBalance[];
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<UserProfile>;
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<UserProfile>;
  completeRegistration: (data: Parameters<typeof authApi.register>[0]) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginWithApple: () => Promise<UserProfile>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshBalances: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('elap_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session on initial mount if token exists
  useEffect(() => {
    const initSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const session = await authApi.getSession();
        setUser(session.user);
        setBalances(session.balances);
      } catch (error) {
        console.error('Failed to load user session:', error);
        localStorage.removeItem('elap_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [token]);

  const login = async (identifier: string, password?: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      // 1. If logging in with email, verify whether Firebase requires email verification
      if (identifier.includes('@') && password) {
        try {
          const cred = await signInWithEmailAndPassword(auth, identifier.trim(), password);
          if (cred.user && !cred.user.emailVerified) {
            await cred.user.reload();
            if (!cred.user.emailVerified) {
              const err: any = new Error('EMAIL_NOT_VERIFIED');
              err.code = 'EMAIL_NOT_VERIFIED';
              throw err;
            }
          }
        } catch (fbErr: any) {
          if (fbErr.code === 'EMAIL_NOT_VERIFIED' || fbErr.message === 'EMAIL_NOT_VERIFIED') {
            throw fbErr;
          }
          // Seeded/admin users without Firebase records continue to database auth
        }
      }

      // 2. Authenticate with backend API
      const res = await authApi.login(identifier.trim(), password);
      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async (data: Parameters<typeof authApi.register>[0]): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const email = credential.user.email;
      const res = await authApi.firebaseLogin(idToken, email);

      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const credential = await signInWithPopup(auth, appleProvider);
      const idToken = await credential.user.getIdToken();
      const email = credential.user.email;
      const res = await authApi.firebaseLogin(idToken, email);

      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Parameters<typeof authApi.register>[0]): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      let firebaseUid: string | undefined = undefined;

      // 1. Create user directly in Firebase Auth (registers in Firebase Console)
      try {
        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        firebaseUid = cred.user.uid;
        if (data.name) {
          await updateProfile(cred.user, { displayName: data.name });
        }
        // Dispatch Firebase email verification link to work email
        try {
          await sendEmailVerification(cred.user);
        } catch (verifErr) {
          console.warn('Firebase sendEmailVerification notice:', verifErr);
        }
      } catch (fbErr: any) {
        console.warn('Firebase client signup notice:', fbErr?.code || fbErr?.message || fbErr);
      }

      // 2. Register in system DB with matching firebaseUid
      const res = await authApi.register({ ...data, firebaseUid });
      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  };

  const logout = useCallback(() => {
    signOut(auth).catch(() => {});
    localStorage.removeItem('elap_token');
    setToken(null);
    setUser(null);
    setBalances([]);
    window.location.href = '/login';
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!user) return;
    try {
      const updated = await leaveApi.getBalances();
      setBalances(updated);
    } catch (err) {
      console.error('Failed to refresh leave balances:', err);
    }
  }, [user]);

  const hasRole = useCallback(
    (allowedRoles: Role | Role[]) => {
      if (!user) return false;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return rolesArray.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        balances,
        token,
        isLoading,
        login,
        register,
        completeRegistration,
        loginWithGoogle,
        loginWithApple,
        changePassword,
        logout,
        refreshBalances,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
