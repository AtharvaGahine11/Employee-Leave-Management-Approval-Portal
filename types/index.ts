// ELAP Type Definitions

export type Role = "EMPLOYEE" | "MANAGER" | "HR";

export type LeaveType = "CASUAL_LEAVE" | "SICK_LEAVE" | "EARNED_LEAVE";

export type LeaveStatus =
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED_BY_MANAGER"
  | "REJECTED_BY_HR"
  | "CANCELLED";

export type AuditAction =
  | "LEAVE_SUBMITTED"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED"
  | "HR_APPROVED"
  | "HR_REJECTED"
  | "LEAVE_CANCELLED";

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  annualQuota: number;
  usedDays: number;
  pendingDays: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  role: Role;
  joiningDate: string;
  isActive: boolean;
  phone: string;
  managerId: string | null;
  managerName: string | null;
  balances: Record<LeaveType, LeaveBalance>;
}

export interface LeaveRequest {
  id: string;
  requestId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  managerId?: string;
  managerName?: string;
  managerActionAt?: string;
  managerRemarks?: string;
  hrId?: string;
  hrName?: string;
  hrActionAt?: string;
  hrRemarks?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  leaveRequestId: string;
  requestDisplayId: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  previousStatus: LeaveStatus | null;
  newStatus: LeaveStatus;
  remarks?: string;
  timestamp: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: Role;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
}

export interface IAuthService {
  login(email: string, password: string): Promise<{ success: boolean; session?: UserSession; error?: string }>;
  logout(): Promise<void>;
  getSession(): UserSession | null;
  setSession?(session: UserSession): void;
}
