import { apiClient } from './client';
import {
  ApiResponse,
  UserProfile,
  LeaveBalance,
  LeaveRequest,
  Department,
  Comment,
  Attachment,
  AuditLog,
  NotificationItem,
  LeaveStatus,
} from '../types';

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (identifier: string, password?: string) => {
    const response = await apiClient.post<
      ApiResponse<{ token: string; user: UserProfile; balances: LeaveBalance[] }>
    >('/auth/login', { identifier, password });
    return response.data.data;
  },
  firebaseLogin: async (idToken: string, email?: string | null) => {
    const response = await apiClient.post<
      ApiResponse<{ token: string; user: UserProfile; balances: LeaveBalance[] }>
    >('/auth/firebase-login', { idToken, email });
    return response.data.data;
  },
  getSession: async () => {
    const response = await apiClient.get<
      ApiResponse<{ user: UserProfile; balances: LeaveBalance[] }>
    >('/auth/session');
    return response.data.data;
  },
  register: async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    departmentId?: string;
    designation?: string;
    phone?: string;
    role?: 'EMPLOYEE' | 'MANAGER' | 'HR';
  }) => {
    const response = await apiClient.post<
      ApiResponse<{ token: string; user: UserProfile; balances: LeaveBalance[] }>
    >('/auth/register', data);
    return response.data.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// ==========================================
// EMPLOYEES & DEPARTMENTS API
// ==========================================
export const employeeApi = {
  getProfile: async () => {
    const response = await apiClient.get<
      ApiResponse<{ employee: UserProfile; balances: LeaveBalance[] }>
    >('/employees/profile');
    return response.data.data;
  },
  getTeam: async () => {
    const response = await apiClient.get<ApiResponse<UserProfile[]>>('/employees/team');
    return response.data.data;
  },
  createEmployee: async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    departmentId: string;
    designation: string;
    role?: string;
    phone?: string;
    managerId?: string;
  }) => {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/employees', data);
    return response.data.data;
  },
};

export const departmentApi = {
  getDepartments: async () => {
    const response = await apiClient.get<ApiResponse<Department[]>>('/departments');
    return response.data.data;
  },
};

// ==========================================
// LEAVES API
// ==========================================
export const leaveApi = {
  createLeave: async (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    isDraft?: boolean;
  }) => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>('/leaves', data);
    return response.data.data;
  },
  getLeaves: async (params?: { status?: LeaveStatus; leaveTypeId?: string; search?: string }) => {
    const response = await apiClient.get<ApiResponse<LeaveRequest[]>>('/leaves', { params });
    return response.data.data;
  },
  getBalances: async () => {
    const response = await apiClient.get<ApiResponse<LeaveBalance[]>>('/leaves/balances');
    return response.data.data;
  },
  getLeaveDetails: async (id: string) => {
    const response = await apiClient.get<
      ApiResponse<{ leaveRequest: LeaveRequest; balances: LeaveBalance[] }>
    >(`/leaves/${id}`);
    return response.data.data;
  },
  submitDraft: async (id: string) => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/leaves/${id}/submit`);
    return response.data.data;
  },
  cancelLeave: async (id: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/leaves/${id}/cancel`);
    return response.data;
  },
};

// ==========================================
// APPROVALS API (MANAGER & HR)
// ==========================================
export const approvalApi = {
  // Manager
  getManagerLeaves: async (params?: { status?: LeaveStatus; search?: string }) => {
    const response = await apiClient.get<ApiResponse<LeaveRequest[]>>('/manager/leaves', { params });
    return response.data.data;
  },
  managerApprove: async (id: string, comment?: string) => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/manager/leaves/${id}/approve`, {
      comment,
    });
    return response.data.data;
  },
  managerReject: async (id: string, comment: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/manager/leaves/${id}/reject`, {
      comment,
    });
    return response.data;
  },

  // HR
  getHrLeaves: async (params?: {
    departmentId?: string;
    status?: LeaveStatus;
    leaveTypeId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<LeaveRequest[]>>('/hr/leaves', { params });
    return response.data.data;
  },
  hrApprove: async (id: string, comment?: string) => {
    const response = await apiClient.post<ApiResponse<LeaveRequest>>(`/hr/leaves/${id}/approve`, {
      comment,
    });
    return response.data.data;
  },
  hrReject: async (id: string, comment: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/hr/leaves/${id}/reject`, {
      comment,
    });
    return response.data;
  },
};

// ==========================================
// COMMENTS & ATTACHMENTS API
// ==========================================
export const commentApi = {
  getComments: async (requestId: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/leaves/${requestId}/comments`);
    return response.data.data;
  },
  addComment: async (requestId: string, body: string) => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/leaves/${requestId}/comments`, { body });
    return response.data.data;
  },
  searchComments: async (query: string, leaveRequestId?: string) => {
    const response = await apiClient.get<ApiResponse<Comment[]>>('/comments/search', {
      params: { query, leaveRequestId },
    });
    return response.data.data;
  },
};

export const attachmentApi = {
  uploadAttachment: async (requestId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<Attachment>>(`/leaves/${requestId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};

// ==========================================
// REPORTS & AUDIT & NOTIFICATIONS & CRON API
// ==========================================
export const reportApi = {
  getLeaveSummaryReport: async (params?: { departmentId?: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get<ApiResponse<any>>('/reports/leaves', { params });
    return response.data.data;
  },
  exportLeavesCSV: async (params?: {
    departmentId?: string;
    status?: LeaveStatus;
    leaveTypeId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get('/reports/leaves/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export const auditApi = {
  getAuditLogs: async (params?: { limit?: number; action?: string; search?: string; startDate?: string; endDate?: string } | number) => {
    const queryParams = typeof params === 'number' ? { limit: params } : params;
    const response = await apiClient.get<ApiResponse<AuditLog[]>>('/hr/audit', { params: queryParams });
    return response.data.data;
  },
  exportAuditCSV: async (params?: { action?: string; search?: string; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/hr/audit/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
  getRequestAuditLogs: async (requestId: string) => {
    const response = await apiClient.get<ApiResponse<AuditLog[]>>(`/leaves/${requestId}/audit`);
    return response.data.data;
  },
};

export const cronApi = {
  triggerSlaCheck: async () => {
    const response = await apiClient.post<ApiResponse<{ reminderCount: number; escalationCount: number; actions: any[] }>>('/cron/sla-check');
    return response.data;
  },
  simulateAging: async (requestId: string, hours: number) => {
    const response = await apiClient.post<ApiResponse<any>>('/cron/simulate-aging', { requestId, hours });
    return response.data;
  },
};

export const notificationApi = {
  getNotifications: async () => {
    const response = await apiClient.get<
      ApiResponse<{ notifications: NotificationItem[]; unreadCount: number }>
    >('/notifications');
    return response.data.data;
  },
  markAsRead: async (id: string) => {
    await apiClient.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    await apiClient.put('/notifications/read-all');
  },
};
