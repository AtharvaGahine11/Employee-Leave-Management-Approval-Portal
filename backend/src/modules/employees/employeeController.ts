import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getEmployeeLeaveBalances } from '../balances/balanceService.js';
import { logger } from '../../utils/logger.js';
import { getFirebaseAdmin } from '../../config/firebase.js';
import { validateWorkEmail } from '../../utils/workEmailSecurity.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user?.id;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      department: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
    },
  });

  if (!employee) {
    throw new AppError('Employee profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  const balances = await getEmployeeLeaveBalances(employee.id);

  res.status(200).json({
    success: true,
    data: {
      employee,
      balances,
    },
  });
});

export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const managerId = req.user?.id;

  const directReports = await prisma.employee.findMany({
    where: { managerId, active: true },
    include: {
      department: true,
      balances: {
        include: { leaveType: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({
    success: true,
    data: directReports,
  });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const actorRole = req.user?.role;
  const actorId = req.user?.id;

  if (actorRole !== 'HR' && actorRole !== 'MANAGER') {
    throw new AppError('Unauthorized: Only HR and Managers can onboard new employees.', 403, 'FORBIDDEN');
  }

  const {
    name,
    username,
    email,
    password,
    departmentId,
    designation,
    role,
    phone,
    managerId,
    firebaseUid: clientFirebaseUid,
  } = req.body;

  let assignedRole = 'EMPLOYEE';
  let assignedManagerId: string | null = null;
  let assignedDeptId = departmentId;

  if (actorRole === 'MANAGER') {
    assignedRole = 'EMPLOYEE';
    assignedManagerId = actorId!;
    const managerProfile = await prisma.employee.findUnique({ where: { id: actorId } });
    if (managerProfile) {
      assignedDeptId = managerProfile.departmentId;
    }
  } else if (actorRole === 'HR') {
    assignedRole = (role && ['EMPLOYEE', 'MANAGER', 'HR'].includes(role)) ? role : 'EMPLOYEE';
    assignedManagerId = managerId || null;
  }

  if (!name || !username || !email || !password || !assignedDeptId || !designation) {
    throw new AppError(
      'Name, username, email, password, department, and designation are required.',
      400,
      'MISSING_FIELDS'
    );
  }

  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');
  const cleanEmail = email.toLowerCase().trim();

  // 1. Work Email Security Validation
  const emailValidation = validateWorkEmail(cleanEmail, assignedRole);
  if (!emailValidation.isValid) {
    throw new AppError(
      emailValidation.error || 'Please provide a valid work email address.',
      400,
      'INVALID_WORK_EMAIL'
    );
  }

  if (cleanUsername.length < 3) {
    throw new AppError(
      'Username must be at least 3 characters long and contain only lowercase letters, numbers, underscores, or periods.',
      400,
      'INVALID_USERNAME'
    );
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT');
  }

  // Check uniqueness of username and email
  const existing = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { username: cleanUsername },
      ],
    },
  });

  if (existing) {
    if (existing.username === cleanUsername) {
      throw new AppError(`Username '@${cleanUsername}' is already taken. Please choose another username.`, 409, 'USERNAME_EXISTS');
    }
    throw new AppError(`Email '${cleanEmail}' is already registered in the system.`, 409, 'EMAIL_EXISTS');
  }

  const count = await prisma.employee.count();
  const year = new Date().getFullYear();
  const employeeId = `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  
  // 2. Firebase Auth Identity Mapping
  let firebaseUid = clientFirebaseUid || `uid_${cleanUsername}_${Date.now()}`;

  // Provision in Firebase Auth via Admin SDK if client UID not passed
  if (!clientFirebaseUid) {
    const firebaseAdmin = getFirebaseAdmin();
    if (firebaseAdmin) {
      try {
        const fbUser = await firebaseAdmin.auth().createUser({
          email: cleanEmail,
          password,
          displayName: name.trim(),
        });
        firebaseUid = fbUser.uid;
        logger.info(`🔥 Provisioned user in Firebase Auth via Admin: ${cleanEmail} (${firebaseUid})`);
      } catch (fbErr: any) {
        logger.warn('Firebase Admin createUser notice:', fbErr?.message || fbErr);
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create employee in database
  const newEmployee = await prisma.employee.create({
    data: {
      employeeId,
      firebaseUid,
      username: cleanUsername,
      passwordHash,
      name: name.trim(),
      email: cleanEmail,
      role: assignedRole,
      designation: designation.trim(),
      phone: phone?.trim() || null,
      joiningDate: new Date(),
      active: true,
      departmentId: assignedDeptId,
      managerId: assignedManagerId,
    },
    include: {
      department: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Automatically provision the 3 standard Leave Balances (CL: 12, SL: 12, EL: 15)
  const leaveTypes = await prisma.leaveType.findMany();
  for (const lt of leaveTypes) {
    await prisma.leaveBalance.create({
      data: {
        employeeId: newEmployee.id,
        leaveTypeId: lt.id,
        year,
        openingBalance: lt.annualEntitlement,
        approvedDays: 0,
        pendingDays: 0,
        availableDays: lt.annualEntitlement,
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'LEAVE_SUBMITTED',
      actorId: actorId!,
      actorRole: actorRole!,
      metadata: JSON.stringify({
        event: 'EMPLOYEE_ONBOARDED',
        createdEmployeeId: newEmployee.id,
        username: newEmployee.username,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department.name,
      }),
    },
  });

  logger.info(`✨ New Employee onboarded: ${newEmployee.name} (@${newEmployee.username}) by ${actorRole}`);

  res.status(201).json({
    success: true,
    data: newEmployee,
    message: `Employee ${newEmployee.name} (@${newEmployee.username}) created successfully.`,
  });
});

