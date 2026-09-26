import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, LeaveBalance, Role } from '../types';
import { authApi, leaveApi } from '../api';
import { auth, signInWithEmailAndPassword, signOut, signInWithPopup, googleProvider, appleProvider } from '../config/firebase';

interface AuthContextType {
  user: UserProfile | null;
  balances: LeaveBalance[];
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (data: Parameters<typeof authApi.register>[0]) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
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

  const login = async (identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(identifier.trim(), password);
      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async () => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Parameters<typeof authApi.register>[0]) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      localStorage.setItem('elap_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setBalances(res.balances);
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
