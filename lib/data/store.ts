import {
  Department,
  Employee,
  LeaveRequest,
  AuditLog,
  LeaveType,
  LeaveStatus,
  AuditAction,
  Role,
} from "@/types";

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: "dept-1", code: "ENG", name: "Engineering", description: "Software development, platform engineering, and architecture" },
  { id: "dept-2", code: "PROD", name: "Product", description: "Product strategy, roadmap planning, and UX design" },
  { id: "dept-3", code: "HR", name: "Human Resources", description: "Talent acquisition, employee experience, and operations" },
  { id: "dept-4", code: "FIN", name: "Finance", description: "Corporate finance, payroll, compliance, and accounting" },
  { id: "dept-5", code: "SALES", name: "Sales", description: "Enterprise sales, client relations, and growth" },
  { id: "dept-6", code: "MKTG", name: "Marketing", description: "Brand awareness, content, demand gen, and PR" },
  { id: "dept-7", code: "OPS", name: "Operations", description: "Business processes, facilities, and administration" },
  { id: "dept-8", code: "CS", name: "Customer Support", description: "Customer success, support desk, and SLAs" },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    employeeId: "EMP-1001",
    name: "Priya Patel",
    email: "hr@elap.demo",
    departmentId: "dept-3",
    departmentName: "Human Resources",
    designation: "HR Operations Lead",
    role: "HR",
    joiningDate: "2021-03-15",
    isActive: true,
    phone: "+91 98201 12345",
    managerId: null,
    managerName: null,
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 3, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 4, pendingDays: 0 },
    },
  },
  {
    id: "emp-2",
    employeeId: "EMP-1002",
    name: "Rahul Nair",
    email: "manager@elap.demo",
    departmentId: "dept-1",
    departmentName: "Engineering",
    designation: "Engineering Lead",
    role: "MANAGER",
    joiningDate: "2020-07-01",
    isActive: true,
    phone: "+91 98450 67890",
    managerId: null,
    managerName: null,
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 0, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 5, pendingDays: 0 },
    },
  },
  {
    id: "emp-3",
    employeeId: "EMP-1003",
    name: "Sneha Kulkarni",
    email: "employee@elap.demo",
    departmentId: "dept-1",
    departmentName: "Engineering",
    designation: "Senior Software Engineer",
    role: "EMPLOYEE",
    joiningDate: "2022-01-10",
    isActive: true,
    phone: "+91 97654 32109",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 0, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 0, pendingDays: 0 },
    },
  },
  {
    id: "emp-4",
    employeeId: "EMP-1004",
    name: "Aarav Sharma",
    email: "aarav.sharma@elap.demo",
    departmentId: "dept-1",
    departmentName: "Engineering",
    designation: "Frontend Developer",
    role: "EMPLOYEE",
    joiningDate: "2022-06-15",
    isActive: true,
    phone: "+91 98765 43210",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 4, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 3, pendingDays: 0 },
    },
  },
  {
    id: "emp-5",
    employeeId: "EMP-1005",
    name: "Vikram Malhotra",
    email: "vikram.malhotra@elap.demo",
    departmentId: "dept-2",
    departmentName: "Product",
    designation: "Principal Product Manager",
    role: "MANAGER",
    joiningDate: "2020-11-20",
    isActive: true,
    phone: "+91 98111 22334",
    managerId: null,
    managerName: null,
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 0, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 7, pendingDays: 0 },
    },
  },
  {
    id: "emp-6",
    employeeId: "EMP-1006",
    name: "Ananya Iyer",
    email: "ananya.iyer@elap.demo",
    departmentId: "dept-2",
    departmentName: "Product",
    designation: "Senior UX Designer",
    role: "EMPLOYEE",
    joiningDate: "2022-09-01",
    isActive: true,
    phone: "+91 99203 44556",
    managerId: "emp-5",
    managerName: "Vikram Malhotra",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 3, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 2, pendingDays: 0 },
    },
  },
  {
    id: "emp-7",
    employeeId: "EMP-1007",
    name: "Rohan Verma",
    email: "rohan.verma@elap.demo",
    departmentId: "dept-4",
    departmentName: "Finance",
    designation: "Lead Financial Analyst",
    role: "EMPLOYEE",
    joiningDate: "2021-08-15",
    isActive: true,
    phone: "+91 98300 77889",
    managerId: null,
    managerName: "CFO Office",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 5, pendingDays: 0 },
    },
  },
  {
    id: "emp-8",
    employeeId: "EMP-1008",
    name: "Neha Gupta",
    email: "neha.gupta@elap.demo",
    departmentId: "dept-5",
    departmentName: "Sales",
    designation: "Regional Sales Director",
    role: "MANAGER",
    joiningDate: "2020-04-10",
    isActive: true,
    phone: "+91 97110 99887",
    managerId: null,
    managerName: null,
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 3, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 0, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 6, pendingDays: 0 },
    },
  },
  {
    id: "emp-9",
    employeeId: "EMP-1009",
    name: "Rajesh Menon",
    email: "rajesh.menon@elap.demo",
    departmentId: "dept-6",
    departmentName: "Marketing",
    designation: "Brand & Content Manager",
    role: "EMPLOYEE",
    joiningDate: "2023-02-01",
    isActive: true,
    phone: "+91 98401 55667",
    managerId: null,
    managerName: "CMO Office",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 0, pendingDays: 0 },
    },
  },
  {
    id: "emp-10",
    employeeId: "EMP-1010",
    name: "Kavita Rao",
    email: "kavita.rao@elap.demo",
    departmentId: "dept-8",
    departmentName: "Customer Support",
    designation: "Customer Success Lead",
    role: "MANAGER",
    joiningDate: "2021-05-18",
    isActive: true,
    phone: "+91 99002 33445",
    managerId: null,
    managerName: null,
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 4, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 4, pendingDays: 0 },
    },
  },
  {
    id: "emp-11",
    employeeId: "EMP-1011",
    name: "Amit Deshmukh",
    email: "amit.deshmukh@elap.demo",
    departmentId: "dept-1",
    departmentName: "Engineering",
    designation: "Site Reliability Engineer",
    role: "EMPLOYEE",
    joiningDate: "2022-10-05",
    isActive: true,
    phone: "+91 98230 44556",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 5, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 1, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 2, pendingDays: 0 },
    },
  },
  {
    id: "emp-12",
    employeeId: "EMP-1012",
    name: "Pooja Joshi",
    email: "pooja.joshi@elap.demo",
    departmentId: "dept-7",
    departmentName: "Operations",
    designation: "Facilities & Ops Specialist",
    role: "EMPLOYEE",
    joiningDate: "2023-01-16",
    isActive: true,
    phone: "+91 97300 11223",
    managerId: null,
    managerName: "VP Operations",
    balances: {
      CASUAL_LEAVE: { leaveType: "CASUAL_LEAVE", annualQuota: 12, usedDays: 2, pendingDays: 0 },
      SICK_LEAVE: { leaveType: "SICK_LEAVE", annualQuota: 12, usedDays: 0, pendingDays: 0 },
      EARNED_LEAVE: { leaveType: "EARNED_LEAVE", annualQuota: 15, usedDays: 1, pendingDays: 0 },
    },
  },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lr-001",
    requestId: "LR-2026-001",
    employeeId: "emp-4",
    employeeName: "Aarav Sharma",
    employeeEmail: "aarav.sharma@elap.demo",
    departmentName: "Engineering",
    leaveType: "CASUAL_LEAVE",
    startDate: "2026-08-10",
    endDate: "2026-08-12",
    totalDays: 3,
    reason: "Attending family marriage ceremony in Pune",
    status: "APPROVED",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    managerActionAt: "2026-08-05T10:30:00Z",
    managerRemarks: "Approved, team coverage ensured.",
    hrId: "emp-1",
    hrName: "Priya Patel",
    hrActionAt: "2026-08-06T14:15:00Z",
    hrRemarks: "Final approval granted. Verified balance.",
    createdAt: "2026-08-04T09:00:00Z",
  },
  {
    id: "lr-002",
    requestId: "LR-2026-002",
    employeeId: "emp-6",
    employeeName: "Ananya Iyer",
    employeeEmail: "ananya.iyer@elap.demo",
    departmentName: "Product",
    leaveType: "EARNED_LEAVE",
    startDate: "2026-08-20",
    endDate: "2026-08-22",
    totalDays: 3,
    reason: "Personal vacation trip",
    status: "APPROVED",
    managerId: "emp-5",
    managerName: "Vikram Malhotra",
    managerActionAt: "2026-08-15T11:00:00Z",
    managerRemarks: "Design deliverables handed over. Approved.",
    hrId: "emp-1",
    hrName: "Priya Patel",
    hrActionAt: "2026-08-16T12:00:00Z",
    hrRemarks: "Approved as per policy.",
    createdAt: "2026-08-14T16:20:00Z",
  },
  {
    id: "lr-003",
    requestId: "LR-2026-003",
    employeeId: "emp-11",
    employeeName: "Amit Deshmukh",
    employeeEmail: "amit.deshmukh@elap.demo",
    departmentName: "Engineering",
    leaveType: "CASUAL_LEAVE",
    startDate: "2026-09-01",
    endDate: "2026-09-02",
    totalDays: 2,
    reason: "Urgent personal work",
    status: "REJECTED_BY_MANAGER",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    managerActionAt: "2026-08-30T15:00:00Z",
    managerRemarks: "Critical deployment scheduled on production on Sept 1st. Please reschedule.",
    createdAt: "2026-08-29T10:00:00Z",
  },
  {
    id: "lr-004",
    requestId: "LR-2026-004",
    employeeId: "emp-3",
    employeeName: "Sneha Kulkarni",
    employeeEmail: "employee@elap.demo",
    departmentName: "Engineering",
    leaveType: "CASUAL_LEAVE",
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    totalDays: 2,
    reason: "Visiting parents in Bangalore",
    status: "APPROVED",
    managerId: "emp-2",
    managerName: "Rahul Nair",
    managerActionAt: "2026-07-28T09:45:00Z",
    managerRemarks: "Approved.",
    hrId: "emp-1",
    hrName: "Priya Patel",
    hrActionAt: "2026-07-29T11:20:00Z",
    hrRemarks: "Approved.",
    createdAt: "2026-07-27T18:30:00Z",
  },
  {
    id: "lr-005",
    requestId: "LR-2026-005",
    employeeId: "emp-7",
    employeeName: "Rohan Verma",
    employeeEmail: "rohan.verma@elap.demo",
    departmentName: "Finance",
    leaveType: "SICK_LEAVE",
    startDate: "2026-09-07",
    endDate: "2026-09-08",
    totalDays: 2,
    reason: "Medical appointment & rest",
    status: "PENDING_HR",
    managerId: "emp-1",
    managerName: "Finance Head",
    managerActionAt: "2026-09-04T16:00:00Z",
    managerRemarks: "Endorsed. Quick recovery.",
    createdAt: "2026-09-04T11:00:00Z",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-001",
    leaveRequestId: "lr-001",
    requestDisplayId: "LR-2026-001",
    actorId: "emp-4",
    actorName: "Aarav Sharma",
    actorRole: "EMPLOYEE",
    action: "LEAVE_SUBMITTED",
    previousStatus: null,
    newStatus: "PENDING_MANAGER",
    remarks: "Submitted 3 days Casual Leave",
    timestamp: "2026-08-04T09:00:00Z",
  },
  {
    id: "aud-002",
    leaveRequestId: "lr-001",
    requestDisplayId: "LR-2026-001",
    actorId: "emp-2",
    actorName: "Rahul Nair",
    actorRole: "MANAGER",
    action: "MANAGER_APPROVED",
    previousStatus: "PENDING_MANAGER",
    newStatus: "PENDING_HR",
    remarks: "Approved, team coverage ensured.",
    timestamp: "2026-08-05T10:30:00Z",
  },
  {
    id: "aud-003",
    leaveRequestId: "lr-001",
    requestDisplayId: "LR-2026-001",
    actorId: "emp-1",
    actorName: "Priya Patel",
    actorRole: "HR",
    action: "HR_APPROVED",
    previousStatus: "PENDING_HR",
    newStatus: "APPROVED",
    remarks: "Final approval granted. Verified balance.",
    timestamp: "2026-08-06T14:15:00Z",
  },
  {
    id: "aud-004",
    leaveRequestId: "lr-003",
    requestDisplayId: "LR-2026-003",
    actorId: "emp-11",
    actorName: "Amit Deshmukh",
    actorRole: "EMPLOYEE",
    action: "LEAVE_SUBMITTED",
    previousStatus: null,
    newStatus: "PENDING_MANAGER",
    remarks: "Submitted 2 days Casual Leave",
    timestamp: "2026-08-29T10:00:00Z",
  },
  {
    id: "aud-005",
    leaveRequestId: "lr-003",
    requestDisplayId: "LR-2026-003",
    actorId: "emp-2",
    actorName: "Rahul Nair",
    actorRole: "MANAGER",
    action: "MANAGER_REJECTED",
    previousStatus: "PENDING_MANAGER",
    newStatus: "REJECTED_BY_MANAGER",
    remarks: "Critical deployment scheduled on production on Sept 1st. Please reschedule.",
    timestamp: "2026-08-30T15:00:00Z",
  },
];

const STORE_KEY_PREFIX = "elap_data_v1_";

class DataStore {
  private getStorageItem<T>(key: string, defaultVal: T): T {
    if (typeof window === "undefined") return defaultVal;
    try {
      const data = localStorage.getItem(STORE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorageItem<T>(key: string, val: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORE_KEY_PREFIX + key, JSON.stringify(val));
      window.dispatchEvent(new Event("elap_data_updated"));
    } catch (err) {
      console.error("Storage error:", err);
    }
  }

  public init() {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORE_KEY_PREFIX + "departments")) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    this.setStorageItem("departments", INITIAL_DEPARTMENTS);
    this.setStorageItem("employees", INITIAL_EMPLOYEES);
    this.setStorageItem("leaveRequests", INITIAL_LEAVE_REQUESTS);
    this.setStorageItem("auditLogs", INITIAL_AUDIT_LOGS);
  }

  public getDepartments(): Department[] {
    return this.getStorageItem("departments", INITIAL_DEPARTMENTS);
  }

  public getEmployees(): Employee[] {
    return this.getStorageItem("employees", INITIAL_EMPLOYEES);
  }

  public getEmployeeById(idOrEmpId: string): Employee | undefined {
    const employees = this.getEmployees();
    return employees.find((e) => e.id === idOrEmpId || e.employeeId === idOrEmpId || e.email === idOrEmpId);
  }

  public getLeaveRequests(): LeaveRequest[] {
    return this.getStorageItem("leaveRequests", INITIAL_LEAVE_REQUESTS);
  }

  public getAuditLogs(): AuditLog[] {
    return this.getStorageItem("auditLogs", INITIAL_AUDIT_LOGS);
  }

  public createLeaveRequest(params: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
  }): { success: boolean; request?: LeaveRequest; error?: string } {
    const employees = this.getEmployees();
    const employee = employees.find((e) => e.id === params.employeeId || e.employeeId === params.employeeId);
    if (!employee) {
      return { success: false, error: "Employee record not found" };
    }

    // Business Rule 5: Insufficient leave balance should prevent submission
    const balance = employee.balances[params.leaveType];
    const available = balance.annualQuota - balance.usedDays - balance.pendingDays;
    if (params.totalDays > available) {
      return {
        success: false,
        error: `Requested days (${params.totalDays}) exceed available balance (${available} days).`,
      };
    }

    // Business Rule 6: No overlapping leave requests for the same employee
    const existingRequests = this.getLeaveRequests().filter(
      (r) => r.employeeId === employee.id && r.status !== "REJECTED_BY_MANAGER" && r.status !== "REJECTED_BY_HR" && r.status !== "CANCELLED"
    );

    const newStart = new Date(params.startDate).getTime();
    const newEnd = new Date(params.endDate).getTime();

    const hasOverlap = existingRequests.some((r) => {
      const exStart = new Date(r.startDate).getTime();
      const exEnd = new Date(r.endDate).getTime();
      return (newStart <= exEnd && newEnd >= exStart);
    });

    if (hasOverlap) {
      return {
        success: false,
        error: "You already have an active or pending leave request overlapping with these dates.",
      };
    }

    // Create the new request
    const allRequests = this.getLeaveRequests();
    const sequenceNum = allRequests.length + 1;
    const paddedSeq = String(sequenceNum).padStart(3, "0");
    const requestId = `LR-2026-${paddedSeq}`;
    const id = `lr-${Date.now()}`;

    const newRequest: LeaveRequest = {
      id,
      requestId,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      departmentName: employee.departmentName,
      leaveType: params.leaveType,
      startDate: params.startDate,
      endDate: params.endDate,
      totalDays: params.totalDays,
      reason: params.reason,
      status: "PENDING_MANAGER",
      managerId: employee.managerId || undefined,
      managerName: employee.managerName || undefined,
      createdAt: new Date().toISOString(),
    };

    // Update employee pending days
    employee.balances[params.leaveType].pendingDays += params.totalDays;

    // Save updated lists
    this.setStorageItem("employees", employees);
    this.setStorageItem("leaveRequests", [newRequest, ...allRequests]);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      leaveRequestId: newRequest.id,
      requestDisplayId: newRequest.requestId,
      actorId: employee.id,
      actorName: employee.name,
      actorRole: employee.role,
      action: "LEAVE_SUBMITTED",
      previousStatus: null,
      newStatus: "PENDING_MANAGER",
      remarks: `Submitted ${params.totalDays} day(s) ${params.leaveType}. Reason: ${params.reason}`,
      timestamp: new Date().toISOString(),
    };

    const allLogs = this.getAuditLogs();
    this.setStorageItem("auditLogs", [newLog, ...allLogs]);

    return { success: true, request: newRequest };
  }

  public managerReview(params: {
    requestId: string;
    managerId: string;
    managerName: string;
    approved: boolean;
    remarks?: string;
  }): { success: boolean; error?: string } {
    const allRequests = this.getLeaveRequests();
    const reqIndex = allRequests.findIndex((r) => r.id === params.requestId || r.requestId === params.requestId);
    if (reqIndex === -1) {
      return { success: false, error: "Leave request not found" };
    }

    const request = allRequests[reqIndex];
    if (request.status !== "PENDING_MANAGER") {
      return { success: false, error: `Request cannot be reviewed in current status: ${request.status}` };
    }

    const prevStatus = request.status;
    const newStatus: LeaveStatus = params.approved ? "PENDING_HR" : "REJECTED_BY_MANAGER";

    request.status = newStatus;
    request.managerId = params.managerId;
    request.managerName = params.managerName;
    request.managerActionAt = new Date().toISOString();
    request.managerRemarks = params.remarks || (params.approved ? "Approved by Reporting Manager" : "Rejected by Reporting Manager");

    allRequests[reqIndex] = request;
    this.setStorageItem("leaveRequests", allRequests);

    // If rejected, free up pendingDays for employee
    if (!params.approved) {
      const employees = this.getEmployees();
      const emp = employees.find((e) => e.id === request.employeeId);
      if (emp && emp.balances[request.leaveType]) {
        emp.balances[request.leaveType].pendingDays = Math.max(0, emp.balances[request.leaveType].pendingDays - request.totalDays);
        this.setStorageItem("employees", employees);
      }
    }

    // Add Audit Log
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      leaveRequestId: request.id,
      requestDisplayId: request.requestId,
      actorId: params.managerId,
      actorName: params.managerName,
      actorRole: "MANAGER",
      action: params.approved ? "MANAGER_APPROVED" : "MANAGER_REJECTED",
      previousStatus: prevStatus,
      newStatus,
      remarks: request.managerRemarks,
      timestamp: new Date().toISOString(),
    };

    const allLogs = this.getAuditLogs();
    this.setStorageItem("auditLogs", [newLog, ...allLogs]);

    return { success: true };
  }

  public hrReview(params: {
    requestId: string;
    hrId: string;
    hrName: string;
    approved: boolean;
    remarks?: string;
  }): { success: boolean; error?: string } {
    const allRequests = this.getLeaveRequests();
    const reqIndex = allRequests.findIndex((r) => r.id === params.requestId || r.requestId === params.requestId);
    if (reqIndex === -1) {
      return { success: false, error: "Leave request not found" };
    }

    const request = allRequests[reqIndex];
    if (request.status !== "PENDING_HR") {
      return { success: false, error: `Request cannot be reviewed by HR in current status: ${request.status}` };
    }

    const prevStatus = request.status;
    const newStatus: LeaveStatus = params.approved ? "APPROVED" : "REJECTED_BY_HR";

    request.status = newStatus;
    request.hrId = params.hrId;
    request.hrName = params.hrName;
    request.hrActionAt = new Date().toISOString();
    request.hrRemarks = params.remarks || (params.approved ? "Final approval granted by HR" : "Rejected by HR");

    allRequests[reqIndex] = request;
    this.setStorageItem("leaveRequests", allRequests);

    // Update Employee balance: Business Rule 4: Leave balance is deducted only after final HR approval
    const employees = this.getEmployees();
    const emp = employees.find((e) => e.id === request.employeeId);
    if (emp && emp.balances[request.leaveType]) {
      emp.balances[request.leaveType].pendingDays = Math.max(0, emp.balances[request.leaveType].pendingDays - request.totalDays);
      if (params.approved) {
        emp.balances[request.leaveType].usedDays += request.totalDays;
      }
      this.setStorageItem("employees", employees);
    }

    // Add Audit Log
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      leaveRequestId: request.id,
      requestDisplayId: request.requestId,
      actorId: params.hrId,
      actorName: params.hrName,
      actorRole: "HR",
      action: params.approved ? "HR_APPROVED" : "HR_REJECTED",
      previousStatus: prevStatus,
      newStatus,
      remarks: request.hrRemarks,
      timestamp: new Date().toISOString(),
    };

    const allLogs = this.getAuditLogs();
    this.setStorageItem("auditLogs", [newLog, ...allLogs]);

    return { success: true };
  }

  public cancelLeaveRequest(params: {
    requestId: string;
    employeeId: string;
    employeeName: string;
  }): { success: boolean; error?: string } {
    const allRequests = this.getLeaveRequests();
    const reqIndex = allRequests.findIndex((r) => r.id === params.requestId || r.requestId === params.requestId);
    if (reqIndex === -1) {
      return { success: false, error: "Leave request not found" };
    }

    const request = allRequests[reqIndex];
    // Business Rule 7: Cancellation is allowed before HR final approval
    if (request.status !== "PENDING_MANAGER" && request.status !== "PENDING_HR") {
      return { success: false, error: "Cannot cancel a request that has already been finalized" };
    }

    const prevStatus = request.status;
    request.status = "CANCELLED";
    allRequests[reqIndex] = request;
    this.setStorageItem("leaveRequests", allRequests);

    // Free pending days
    const employees = this.getEmployees();
    const emp = employees.find((e) => e.id === request.employeeId);
    if (emp && emp.balances[request.leaveType]) {
      emp.balances[request.leaveType].pendingDays = Math.max(0, emp.balances[request.leaveType].pendingDays - request.totalDays);
      this.setStorageItem("employees", employees);
    }

    // Audit Log
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      leaveRequestId: request.id,
      requestDisplayId: request.requestId,
      actorId: params.employeeId,
      actorName: params.employeeName,
      actorRole: "EMPLOYEE",
      action: "LEAVE_CANCELLED",
      previousStatus: prevStatus,
      newStatus: "CANCELLED",
      remarks: "Cancelled by applicant before final processing",
      timestamp: new Date().toISOString(),
    };

    const allLogs = this.getAuditLogs();
    this.setStorageItem("auditLogs", [newLog, ...allLogs]);

    return { success: true };
  }
}

export const dataStore = new DataStore();
