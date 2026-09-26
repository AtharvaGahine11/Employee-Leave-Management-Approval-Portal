import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, LeaveTypeCode, LeaveStatus, AuditAction } from '../src/types/enums.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ELAP Database Seeding...');

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.leaveType.deleteMany();

  console.log('🧹 Cleaned database');

  // 2. Seed 8 Configurable Departments
  const departmentsData = [
    { code: 'IT', name: 'Information Technology' },
    { code: 'FIN', name: 'Finance' },
    { code: 'MKT', name: 'Marketing' },
    { code: 'PROC', name: 'Procurement' },
    { code: 'LEG', name: 'Legal' },
    { code: 'OPS', name: 'Operations' },
    { code: 'ADMIN', name: 'Administration' },
    { code: 'CS', name: 'Customer Support' },
  ];

  const departments: Record<string, any> = {};
  for (const dept of departmentsData) {
    departments[dept.code] = await prisma.department.create({
      data: {
        code: dept.code,
        name: dept.name,
        active: true,
      },
    });
  }
  console.log('🏢 Seeded 8 Departments');

  // 3. Seed Core Leave Types (CL, SL, EL)
  const leaveTypesData = [
    {
      code: LeaveTypeCode.CL,
      name: 'Casual Leave',
      annualEntitlement: 12,
      maxConsecutive: 3,
      carryForward: false,
      maxCarryForward: 0,
      encashment: false,
      minNoticeDays: 0,
    },
    {
      code: LeaveTypeCode.SL,
      name: 'Sick Leave',
      annualEntitlement: 12,
      maxConsecutive: null,
      carryForward: false,
      maxCarryForward: 0,
      encashment: false,
      minNoticeDays: 0,
    },
    {
      code: LeaveTypeCode.EL,
      name: 'Earned Leave',
      annualEntitlement: 15,
      maxConsecutive: null,
      carryForward: true,
      maxCarryForward: 30,
      encashment: true,
      minNoticeDays: 2,
    },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    leaveTypes[lt.code] = await prisma.leaveType.create({
      data: lt,
    });
  }
  console.log('🌴 Seeded Leave Types (CL: 12, SL: 12, EL: 15)');

  // 4. Seed Key Demo Users (HR, Manager, Employee)
  // HR Manager
  const hrUser = await prisma.employee.create({
    data: {
      firebaseUid: 'demo-uid-hr-001',
      employeeId: 'EMP-3001',
      username: 'sarah_hr',
      passwordHash: defaultPasswordHash,
      name: 'Sarah Jenkins (HR Lead)',
      email: 'hr@elap.com',
      role: Role.HR,
      designation: 'HR Director',
      phone: '+91 98765 43210',
      joiningDate: new Date('2021-01-15'),
      departmentId: departments['ADMIN'].id,
    },
  });

  // Reporting Manager (IT Dept)
  const managerUser = await prisma.employee.create({
    data: {
      firebaseUid: 'demo-uid-mgr-001',
      employeeId: 'EMP-2001',
      username: 'atharva_mgr',
      passwordHash: defaultPasswordHash,
      name: 'Atharva Gahine (Tech Lead)',
      email: 'manager@elap.com',
      role: Role.MANAGER,
      designation: 'Engineering Manager',
      phone: '+91 98765 43211',
      joiningDate: new Date('2022-03-01'),
      departmentId: departments['IT'].id,
    },
  });

  // Standard Employee (IT Dept, Reports to Atharva)
  const employeeUser = await prisma.employee.create({
    data: {
      firebaseUid: 'demo-uid-emp-001',
      employeeId: 'EMP-1001',
      username: 'rahul_sharma',
      passwordHash: defaultPasswordHash,
      name: 'Rahul Sharma (Senior Developer)',
      email: 'employee@elap.com',
      role: Role.EMPLOYEE,
      designation: 'Software Engineer',
      phone: '+91 98765 43212',
      joiningDate: new Date('2023-06-15'),
      departmentId: departments['IT'].id,
      managerId: managerUser.id,
    },
  });

  // Additional Team Members across other departments for realistic HR charts
  const additionalEmployees = [
    {
      firebaseUid: 'demo-uid-emp-002',
      employeeId: 'EMP-1002',
      username: 'priya_p',
      passwordHash: defaultPasswordHash,
      name: 'Priya Patel',
      email: 'priya.p@elap.com',
      role: Role.EMPLOYEE,
      designation: 'Frontend Developer',
      departmentId: departments['IT'].id,
      managerId: managerUser.id,
      joiningDate: new Date('2023-09-01'),
    },
    {
      firebaseUid: 'demo-uid-emp-003',
      employeeId: 'EMP-1003',
      username: 'vikram_s',
      passwordHash: defaultPasswordHash,
      name: 'Vikram Singh',
      email: 'vikram.s@elap.com',
      role: Role.MANAGER,
      designation: 'Finance Manager',
      departmentId: departments['FIN'].id,
      joiningDate: new Date('2022-01-10'),
    },
    {
      firebaseUid: 'demo-uid-emp-004',
      employeeId: 'EMP-1004',
      username: 'neha_v',
      passwordHash: defaultPasswordHash,
      name: 'Neha Verma',
      email: 'neha.v@elap.com',
      role: Role.EMPLOYEE,
      designation: 'Financial Analyst',
      departmentId: departments['FIN'].id,
      joiningDate: new Date('2024-02-15'),
    },
    {
      firebaseUid: 'demo-uid-emp-005',
      employeeId: 'EMP-1005',
      username: 'amitabh_r',
      passwordHash: defaultPasswordHash,
      name: 'Amitabh Roy',
      email: 'amitabh.r@elap.com',
      role: Role.EMPLOYEE,
      designation: 'Marketing Specialist',
      departmentId: departments['MKT'].id,
      joiningDate: new Date('2023-11-01'),
    },
  ];

  const createdAdditional: any[] = [];
  for (const empData of additionalEmployees) {
    const emp = await prisma.employee.create({ data: empData });
    createdAdditional.push(emp);
  }

  // Link Neha to Vikram
  await prisma.employee.update({
    where: { id: createdAdditional[2].id }, // Neha
    data: { managerId: createdAdditional[1].id }, // Vikram
  });

  console.log('👥 Seeded Demo Employees & Reporting Relationships');

  // 5. Seed Leave Balances for all employees
  const allEmployees = [hrUser, managerUser, employeeUser, ...createdAdditional];
  const currentYear = 2026;

  for (const emp of allEmployees) {
    // CL
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveTypeId: leaveTypes['CL'].id,
        year: currentYear,
        openingBalance: 12,
        approvedDays: emp.id === employeeUser.id ? 2 : 0,
        pendingDays: emp.id === employeeUser.id ? 2 : 0,
        availableDays: emp.id === employeeUser.id ? 8 : 12,
      },
    });

    // SL
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveTypeId: leaveTypes['SL'].id,
        year: currentYear,
        openingBalance: 12,
        approvedDays: 0,
        pendingDays: 0,
        availableDays: 12,
      },
    });

    // EL
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveTypeId: leaveTypes['EL'].id,
        year: currentYear,
        openingBalance: 15,
        approvedDays: 0,
        pendingDays: 0,
        availableDays: 15,
      },
    });
  }
  console.log('📊 Seeded Initial Leave Balances for 2026');

  // 6. Seed Sample Leave Requests in Various States
  const now = new Date();

  // Request 1: PENDING_MANAGER (Rahul Sharma)
  const reqPendingMgr = await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-001',
      employeeId: employeeUser.id,
      leaveTypeId: leaveTypes['CL'].id,
      startDate: new Date('2026-10-05'),
      endDate: new Date('2026-10-06'),
      daysCount: 2,
      reason: 'Family function in hometown',
      status: LeaveStatus.PENDING_MANAGER,
      submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12), // 12 hrs ago
    },
  });

  await prisma.auditLog.create({
    data: {
      leaveRequestId: reqPendingMgr.id,
      actorId: employeeUser.id,
      actorRole: Role.EMPLOYEE,
      action: AuditAction.LEAVE_SUBMITTED,
      previousStatus: LeaveStatus.DRAFT,
      newStatus: LeaveStatus.PENDING_MANAGER,
      metadata: JSON.stringify({ reason: 'Submitted leave request' }),
    },
  });

  // Request 2: PENDING_HR (Priya Patel -> Approved by Manager)
  const reqPendingHr = await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-002',
      employeeId: createdAdditional[0].id, // Priya
      leaveTypeId: leaveTypes['EL'].id,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-19'),
      daysCount: 5,
      reason: 'Planned vacation trip to Goa',
      status: LeaveStatus.PENDING_HR,
      submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 30),
    },
  });

  await prisma.approval.create({
    data: {
      leaveRequestId: reqPendingHr.id,
      approverId: managerUser.id,
      tier: Role.MANAGER,
      decision: LeaveStatus.APPROVED,
      comment: 'Approved. Project deliverables are aligned.',
    },
  });

  await prisma.auditLog.create({
    data: {
      leaveRequestId: reqPendingHr.id,
      actorId: managerUser.id,
      actorRole: Role.MANAGER,
      action: AuditAction.MANAGER_APPROVED,
      previousStatus: LeaveStatus.PENDING_MANAGER,
      newStatus: LeaveStatus.PENDING_HR,
      metadata: JSON.stringify({ comment: 'Approved by Tech Lead' }),
    },
  });

  // Request 3: APPROVED (Rahul Sharma -> Approved by Manager and HR)
  const reqApproved = await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-003',
      employeeId: employeeUser.id,
      leaveTypeId: leaveTypes['CL'].id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-11'),
      daysCount: 2,
      reason: 'Personal urgent work',
      status: LeaveStatus.APPROVED,
      submittedAt: new Date('2026-09-02'),
    },
  });

  await prisma.approval.create({
    data: {
      leaveRequestId: reqApproved.id,
      approverId: managerUser.id,
      tier: Role.MANAGER,
      decision: LeaveStatus.APPROVED,
      comment: 'Recommended for approval',
    },
  });

  await prisma.approval.create({
    data: {
      leaveRequestId: reqApproved.id,
      approverId: hrUser.id,
      tier: Role.HR,
      decision: LeaveStatus.APPROVED,
      comment: 'Final approval granted. Policy compliance verified.',
    },
  });

  await prisma.auditLog.create({
    data: {
      leaveRequestId: reqApproved.id,
      actorId: hrUser.id,
      actorRole: Role.HR,
      action: AuditAction.HR_APPROVED,
      previousStatus: LeaveStatus.PENDING_HR,
      newStatus: LeaveStatus.APPROVED,
      metadata: JSON.stringify({ comment: 'Final HR approval' }),
    },
  });

  // Request 4: ESCALATED (Amitabh Roy -> Manager Inaction > 72 hours)
  const reqEscalated = await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-004',
      employeeId: createdAdditional[3].id, // Amitabh
      leaveTypeId: leaveTypes['SL'].id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-03'),
      daysCount: 3,
      reason: 'Medical checkup and recovery',
      status: LeaveStatus.ESCALATED,
      submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 80), // 80 hrs ago
    },
  });

  await prisma.auditLog.create({
    data: {
      leaveRequestId: reqEscalated.id,
      actorId: hrUser.id,
      actorRole: Role.HR,
      action: AuditAction.ESCALATED,
      previousStatus: LeaveStatus.PENDING_MANAGER,
      newStatus: LeaveStatus.ESCALATED,
      metadata: JSON.stringify({ reason: 'Auto-escalated due to manager inaction > 72h' }),
    },
  });

  // Request 5: REJECTED_BY_MANAGER (Neha Verma)
  const reqRejectedMgr = await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-005',
      employeeId: createdAdditional[2].id, // Neha
      leaveTypeId: leaveTypes['EL'].id,
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-20'),
      daysCount: 10,
      reason: 'Long vacation',
      status: LeaveStatus.REJECTED_BY_MANAGER,
      submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
    },
  });

  await prisma.approval.create({
    data: {
      leaveRequestId: reqRejectedMgr.id,
      approverId: createdAdditional[1].id, // Vikram (Manager)
      tier: Role.MANAGER,
      decision: LeaveStatus.REJECTED_BY_MANAGER,
      comment: 'Quarter-end audit during this period. Please reschedule.',
    },
  });

  // Request 6: DRAFT (Rahul Sharma)
  await prisma.leaveRequest.create({
    data: {
      requestId: 'LR-2026-006',
      employeeId: employeeUser.id,
      leaveTypeId: leaveTypes['EL'].id,
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-05'),
      daysCount: 5,
      reason: 'Draft planned leave for Diwali',
      status: LeaveStatus.DRAFT,
    },
  });

  // Seed initial notification for demo manager & HR
  await prisma.notification.create({
    data: {
      recipientId: managerUser.id,
      title: 'New Leave Request',
      message: 'Rahul Sharma submitted a Casual Leave request for 2 days.',
      type: 'INFO',
      link: `/manager/leaves/${reqPendingMgr.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: hrUser.id,
      title: 'Leave Request Escalated',
      message: 'Leave request LR-2026-004 has been escalated due to 72h manager inaction.',
      type: 'DANGER',
      link: `/hr/leaves/${reqEscalated.id}`,
    },
  });

  console.log('✅ Seeded Sample Leave Requests & Audit Trail');
  console.log('\n----------------------------------------');
  console.log('🔑 DEMO ACCOUNTS FOR LOGIN / TESTING:');
  console.log('1. Employee: employee@elap.com (Role: EMPLOYEE)');
  console.log('2. Manager:  manager@elap.com  (Role: MANAGER)');
  console.log('3. HR Lead:  hr@elap.com       (Role: HR)');
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
