"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role, UserSession } from "@/types";
import { authService, DEMO_USERS } from "./auth-service";

interface AuthContextType {
  user: UserSession | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUserRole: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const sessionUser: UserSession = {
            id: data.user.id || "usr-emp-001",
            email: data.user.email || "",
            role: (data.user.role as Role) || "EMPLOYEE",
            employeeId: data.user.employeeId || "EMP-1003",
            name: data.user.name || "Employee User",
            department: data.user.department || "Engineering",
            designation: data.user.designation || "Software Engineer",
          };
          setUser(sessionUser);
          if (authService.setSession) authService.setSession(sessionUser);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // Fall back to client storage session
    }

    const localSession = authService.getSession();
    setUser(localSession);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await authService.login(email, password);
    if (result.success && result.session) {
      setUser(result.session);
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: result.error || "Authentication failed" };
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setUser(null);
    setIsLoading(false);
    router.push("/login");
  };

  const switchUserRole = async (email: string) => {
    const demo = DEMO_USERS[email];
    if (demo) {
      setIsLoading(true);
      await authService.login(email, demo.password);
      const session = authService.getSession();
      setUser(session);
      setIsLoading(false);
      router.push("/dashboard");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
