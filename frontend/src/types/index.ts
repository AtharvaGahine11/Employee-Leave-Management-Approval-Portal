export type Role = 'EMPLOYEE' | 'MANAGER' | 'HR';

export type LeaveTypeCode = 'CL' | 'SL' | 'EL';

export type LeaveStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER'
  | 'PENDING_HR'
  | 'ESCALATED'
  | 'APPROVED'
  | 'REJECTED_BY_MANAGER'
  | 'REJECTED_BY_HR'
  | 'CANCELLED';

export type AuditAction =
  | 'LEAVE_CREATED'
  | 'LEAVE_SUBMITTED'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'HR_APPROVED'
  | 'HR_REJECTED'
  | 'LEAVE_CANCELLED'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_UPLOADED'
  | 'REMINDER_SENT'
  | 'ESCALATED';

export interface Department {
  id: string;
  code: string;
  name: string;
  active?: boolean;
}

export interface ManagerSummary {
  id: string;
  name: string;
  email: string;
  designation: string;
}

export interface UserProfile {
  id: string;
  employeeId: string;
  username?: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  phone?: string | null;
  joiningDate: string;
  department: Department;
  managerId?: string | null;
  manager?: ManagerSummary | null;
}

export interface LeaveType {
  id: string;
  code: LeaveTypeCode;
  name: string;
  annualEntitlement: number;
  maxConsecutive: number | null;
  carryForward: boolean;
  maxCarryForward: number;
  encashment: boolean;
  minNoticeDays: number;
}

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  code: LeaveTypeCode;
  name: string;
  year: number;
  openingBalance: number;
  approvedDays: number;
  pendingDays: number;
  availableDays: number;
  maxConsecutive: number | null;
  carryForward: boolean;
  encashment: boolean;
  minNoticeDays: number;
}

export interface Approval {
  id: string;
  leaveRequestId: string;
  approverId: string;
  approver: {
    id: string;
    name: string;
    email?: string;
    role: Role;
    designation?: string;
  };
  tier: Role;
  decision: LeaveStatus;
  comment: string | null;
  actedAt: string;
}

export interface Comment {
  id: string;
  leaveRequestId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: Role;
    department?: { name: string };
  };
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  leaveRequestId: string;
  uploaderId: string;
  publicId: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  leaveRequestId?: string | null;
  leaveRequest?: {
    requestId: string;
    leaveType?: { code: string; name: string };
  } | null;
  actorId: string;
  actor: {
    id: string;
    name: string;
    employeeId: string;
    role: Role;
    department?: { name: string };
  };
  actorRole: Role;
  action: AuditAction;
  previousStatus: LeaveStatus | null;
  newStatus: LeaveStatus | null;
  metadata?: string | null;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  requestId: string;
  employeeId: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    designation?: string;
    phone?: string | null;
    managerId?: string | null;
    department: Department;
    manager?: ManagerSummary | null;
  };
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvals?: Approval[];
  comments?: Comment[];
  attachments?: Attachment[];
  auditLogs?: AuditLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  errorCode?: string;
  data: T;
}
