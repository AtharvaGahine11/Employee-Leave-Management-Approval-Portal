import { IAuthService, UserSession } from "@/types";

export const DEMO_USERS: Record<string, { password: string; session: UserSession }> = {
  "employee@elap.demo": {
    password: "employee123",
    session: {
      id: "usr-emp-001",
      email: "employee@elap.demo",
      role: "EMPLOYEE",
      employeeId: "EMP-1003",
      name: "Sneha Kulkarni",
      department: "Engineering",
      designation: "Senior Software Engineer",
    },
  },
  "manager@elap.demo": {
    password: "manager123",
    session: {
      id: "usr-mgr-001",
      email: "manager@elap.demo",
      role: "MANAGER",
      employeeId: "EMP-1002",
      name: "Rahul Nair",
      department: "Engineering",
      designation: "Engineering Lead",
    },
  },
  "hr@elap.demo": {
    password: "hr123",
    session: {
      id: "usr-hr-001",
      email: "hr@elap.demo",
      role: "HR",
      employeeId: "EMP-1001",
      name: "Priya Patel",
      department: "Human Resources",
      designation: "HR Operations Lead",
    },
  },
};

const SESSION_STORAGE_KEY = "elap_user_session";

export class MockAuthService implements IAuthService {
  async login(email: string, password: string): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    // Simulate brief network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 350));

    const normalizedEmail = email.trim().toLowerCase();
    const demoUser = DEMO_USERS[normalizedEmail];

    if (!demoUser || demoUser.password !== password) {
      return {
        success: false,
        error: "Invalid email or password. Please verify your credentials.",
      };
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoUser.session));
      } catch (err) {
        console.error("Failed to persist session to localStorage", err);
      }
    }

    return {
      success: true,
      session: demoUser.session,
    };
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (err) {
        console.error("Failed to remove session", err);
      }
    }
  }

  getSession(): UserSession | null {
    if (typeof window === "undefined") return DEMO_USERS["hr@elap.demo"].session;
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        // Auto-seed HR session for seamless demo experience
        const defaultSession = DEMO_USERS["hr@elap.demo"].session;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(defaultSession));
        return defaultSession;
      }
      return JSON.parse(stored) as UserSession;
    } catch {
      return DEMO_USERS["hr@elap.demo"].session;
    }
  }

  setSession(session: UserSession): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (err) {
        console.error("Failed to set session", err);
      }
    }
  }
}

// Singleton instance that can be swapped with SupabaseAuthService or NextAuthService later
export const authService: IAuthService = new MockAuthService();
