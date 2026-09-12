import { PrismaClient, Role, LeaveType, LeaveStatus, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ELAP Database Seeding...");

  // 1. Clean existing records (in dependency order)
  await prisma.notification.deleteMany();
  await prisma.leaveAttachment.deleteMany();
  await prisma.leaveComment.deleteMany();
  await prisma.leaveAuditLog.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Create 8 Corporate Departments
  const departmentsData = [
    { code: "ENG", name: "Engineering", description: "Software development, architecture, infrastructure and DevOps" },
    { code: "PROD", name: "Product Management", description: "Product strategy, user research, roadmap and UX design" },
    { code: "HR", name: "Human Resources", description: "Talent acquisition, employee relations, leave governance, and HR operations" },
    { code: "FIN", name: "Finance & Accounting", description: "Financial planning, payroll, auditing, and accounting" },
    { code: "SALES", name: "Sales & Enterprise", description: "Client acquisition, account management, and enterprise deals" },
    { code: "MKTG", name: "Marketing", description: "Brand awareness, growth marketing, public relations, and content" },
    { code: "OPS", name: "Operations", description: "Internal workflow, facility management, and logistics" },
    { code: "CS", name: "Customer Support", description: "Customer success, technical support, and client satisfaction" },
  ];

  const createdDepts: Record<string, string> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.create({
      data: dept,
    });
    createdDepts[dept.code] = created.id;
  }
  console.log("✅ Seeded 8 Corporate Departments");

  // 3. Common Password Hashes
  const hrPasswordHash = await bcrypt.hash("hr123", 10);
  const managerPasswordHash = await bcrypt.hash("manager123", 10);
  const employeePasswordHash = await bcrypt.hash("employee123", 10);

  // 4. Create HR User & Employee (Priya Patel)
  const hrUser = await prisma.user.create({
    data: {
      email: "hr@elap.demo",
      passwordHash: hrPasswordHash,
      role: Role.HR,
      employee: {
        create: {
          employeeId: "EMP-1001",
          name: "Priya Patel",
          email: "hr@elap.demo",
          departmentId: createdDepts["HR"],
          designation: "HR Operations Lead",
          role: Role.HR,
          joiningDate: new Date("2021-03-15"),
          phone: "+91 98765 43210",
        },
      },
    },
    include: { employee: true },
  });
  const hrEmpId = hrUser.employee!.id;

  // 5. Create Manager User & Employee (Rahul Nair - Eng Lead)
  const mgrUser = await prisma.user.create({
    data: {
      email: "manager@elap.demo",
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
      employee: {
        create: {
          employeeId: "EMP-1002",
          name: "Rahul Nair",
          email: "manager@elap.demo",
          departmentId: createdDepts["ENG"],
          designation: "Engineering Lead",
          role: Role.MANAGER,
          joiningDate: new Date("2022-01-10"),
          phone: "+91 98765 43211",
        },
      },
    },
    include: { employee: true },
  });
  const mgrEmpId = mgrUser.employee!.id;

  // 6. Create Employee User & Employee (Sneha Kulkarni - Senior Eng, reports to Rahul Nair)
  const empUser = await prisma.user.create({
    data: {
      email: "employee@elap.demo",
      passwordHash: employeePasswordHash,
      role: Role.EMPLOYEE,
      employee: {
        create: {
          employeeId: "EMP-1003",
          name: "Sneha Kulkarni",
          email: "employee@elap.demo",
          departmentId: createdDepts["ENG"],
          designation: "Senior Software Engineer",
          role: Role.EMPLOYEE,
          joiningDate: new Date("2023-06-01"),
          phone: "+91 98765 43212",
          managerId: mgrEmpId,
        },
      },
    },
    include: { employee: true },
  });
  const empEmpId = empUser.employee!.id;

  // 7. Create additional department employees
  const extraEmployeesData = [
    { empId: "EMP-1004", name: "Ananya Sharma", email: "ananya.sharma@elap.demo", dept: "PROD", designation: "Lead Product Manager", role: Role.MANAGER },
    { empId: "EMP-1005", name: "Vikram Mehta", email: "vikram.mehta@elap.demo", dept: "FIN", designation: "Senior Financial Analyst", role: Role.EMPLOYEE },
    { empId: "EMP-1006", name: "Devika Rao", email: "devika.rao@elap.demo", dept: "SALES", designation: "Enterprise Account Executive", role: Role.EMPLOYEE },
    { empId: "EMP-1007", name: "Arjun Verma", email: "arjun.verma@elap.demo", dept: "MKTG", designation: "Growth Marketing Specialist", role: Role.EMPLOYEE },
    { empId: "EMP-1008", name: "Kavita Singh", email: "kavita.singh@elap.demo", dept: "OPS", designation: "Operations Specialist", role: Role.EMPLOYEE },
    { empId: "EMP-1009", name: "Rohan Gupta", email: "rohan.gupta@elap.demo", dept: "CS", designation: "Customer Support Manager", role: Role.MANAGER },
    { empId: "EMP-1010", name: "Neha Joshi", email: "neha.joshi@elap.demo", dept: "ENG", designation: "Frontend Developer", role: Role.EMPLOYEE, managerId: mgrEmpId },
  ];

  const allEmployeeIds = [hrEmpId, mgrEmpId, empEmpId];

  for (const item of extraEmployeesData) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash: employeePasswordHash,
        role: item.role,
        employee: {
          create: {
            employeeId: item.empId,
            name: item.name,
            email: item.email,
            departmentId: createdDepts[item.dept],
            designation: item.designation,
            role: item.role,
            joiningDate: new Date("2023-08-15"),
            managerId: item.managerId || null,
          },
        },
      },
      include: { employee: true },
    });
    allEmployeeIds.push(user.employee!.id);
  }

  console.log(`✅ Seeded ${allEmployeeIds.length} Employees & Users across all 8 Departments`);

  // 8. Seed Leave Balances for 2026 for all employees
  for (const empId of allEmployeeIds) {
    await prisma.leaveBalance.createMany({
      data: [
        { employeeId: empId, leaveType: LeaveType.CASUAL_LEAVE, year: 2026, annualQuota: 12, usedDays: empId === empEmpId ? 3 : 0, pendingDays: 0 },
        { employeeId: empId, leaveType: LeaveType.SICK_LEAVE, year: 2026, annualQuota: 12, usedDays: empId === empEmpId ? 2 : 0, pendingDays: 0 },
        { employeeId: empId, leaveType: LeaveType.EARNED_LEAVE, year: 2026, annualQuota: 15, usedDays: 0, pendingDays: empId === empEmpId ? 3 : 0 },
      ],
    });
  }
  console.log("✅ Seeded Leave Balances (CL: 12, SL: 12, EL: 15) for all Employees");

  // 9. Seed Sample Leave Requests & Audit Logs
  // Request 1: Approved Request for Sneha Kulkarni
  const req1 = await prisma.leaveRequest.create({
    data: {
      requestId: "LR-2026-001",
      employeeId: empEmpId,
      leaveType: LeaveType.CASUAL_LEAVE,
      startDate: new Date("2026-04-10"),
      endDate: new Date("2026-04-14"),
      totalDays: 3,
      reason: "Attending family milestone function out of station",
      status: LeaveStatus.APPROVED,
      managerId: mgrEmpId,
      managerActionAt: new Date("2026-04-02T10:30:00Z"),
      managerRemarks: "Recommended. Team coverage verified.",
      hrId: hrEmpId,
      hrActionAt: new Date("2026-04-02T14:15:00Z"),
      hrRemarks: "Authorized. Leave quota updated.",
      createdAt: new Date("2026-04-01T09:00:00Z"),
    },
  });

  await prisma.leaveAuditLog.createMany({
    data: [
      {
        leaveRequestId: req1.id,
        actorId: empEmpId,
        action: AuditAction.LEAVE_SUBMITTED,
        newStatus: LeaveStatus.PENDING_MANAGER,
        remarks: "Submitted Casual Leave application for 3 days.",
        timestamp: new Date("2026-04-01T09:00:00Z"),
      },
      {
        leaveRequestId: req1.id,
        actorId: mgrEmpId,
        action: AuditAction.MANAGER_APPROVED,
        previousStatus: LeaveStatus.PENDING_MANAGER,
        newStatus: LeaveStatus.PENDING_HR,
        remarks: "Manager endorsement granted.",
        timestamp: new Date("2026-04-02T10:30:00Z"),
      },
      {
        leaveRequestId: req1.id,
        actorId: hrEmpId,
        action: AuditAction.HR_APPROVED,
        previousStatus: LeaveStatus.PENDING_HR,
        newStatus: LeaveStatus.APPROVED,
        remarks: "Final HR authorization granted. Balance deducted.",
        timestamp: new Date("2026-04-02T14:15:00Z"),
      },
    ],
  });

  // Request 2: Pending Manager Request for Sneha Kulkarni
  const req2 = await prisma.leaveRequest.create({
    data: {
      requestId: "LR-2026-002",
      employeeId: empEmpId,
      leaveType: LeaveType.EARNED_LEAVE,
      startDate: new Date("2026-09-20"),
      endDate: new Date("2026-09-24"),
      totalDays: 3,
      reason: "Annual vacation and rest leave",
      status: LeaveStatus.PENDING_MANAGER,
      createdAt: new Date("2026-09-10T11:00:00Z"),
    },
  });

  await prisma.leaveAuditLog.create({
    data: {
      leaveRequestId: req2.id,
      actorId: empEmpId,
      action: AuditAction.LEAVE_SUBMITTED,
      newStatus: LeaveStatus.PENDING_MANAGER,
      remarks: "Submitted Earned Leave request.",
      timestamp: new Date("2026-09-10T11:00:00Z"),
    },
  });

  // Request 3: Pending HR Request for Neha Joshi
  const nehaUser = await prisma.user.findUnique({ where: { email: "neha.joshi@elap.demo" }, include: { employee: true } });
  if (nehaUser?.employee) {
    const req3 = await prisma.leaveRequest.create({
      data: {
        requestId: "LR-2026-003",
        employeeId: nehaUser.employee.id,
        leaveType: LeaveType.SICK_LEAVE,
        startDate: new Date("2026-09-15"),
        endDate: new Date("2026-09-17"),
        totalDays: 2,
        reason: "Viral fever and doctor prescribed bed rest",
        status: LeaveStatus.PENDING_HR,
        managerId: mgrEmpId,
        managerActionAt: new Date("2026-09-11T16:00:00Z"),
        managerRemarks: "Get well soon. Approved.",
        createdAt: new Date("2026-09-11T09:30:00Z"),
      },
    });

    await prisma.leaveAuditLog.createMany({
      data: [
        {
          leaveRequestId: req3.id,
          actorId: nehaUser.employee.id,
          action: AuditAction.LEAVE_SUBMITTED,
          newStatus: LeaveStatus.PENDING_MANAGER,
          remarks: "Submitted Sick Leave application.",
          timestamp: new Date("2026-09-11T09:30:00Z"),
        },
        {
          leaveRequestId: req3.id,
          actorId: mgrEmpId,
          action: AuditAction.MANAGER_APPROVED,
          previousStatus: LeaveStatus.PENDING_MANAGER,
          newStatus: LeaveStatus.PENDING_HR,
          remarks: "Manager endorsed application.",
          timestamp: new Date("2026-09-11T16:00:00Z"),
        },
      ],
    });
  }

  console.log("✅ Seeded Sample Leave Requests and Audit Logs");
  console.log("🚀 ELAP Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
