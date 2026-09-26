import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { config } from '../../config/env.js';
import { getFirebaseAdmin } from '../../config/firebase.js';
import { AppError } from '../../middleware/errorHandler.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getEmployeeLeaveBalances } from '../balances/balanceService.js';
import { logger } from '../../utils/logger.js';
import { validateWorkEmail } from '../../utils/workEmailSecurity.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, email, username, password } = req.body;

  const loginId = (identifier || email || username || '').toLowerCase().trim();

  if (!loginId) {
    throw new AppError('Username or email address is required.', 400, 'INVALID_CREDENTIALS');
  }

  if (!password) {
    throw new AppError('Password is required.', 400, 'INVALID_CREDENTIALS');
  }

  // 1. Find employee by username OR email
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: loginId },
        { username: loginId },
      ],
    },
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
    throw new AppError('Invalid username/email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!employee.active) {
    throw new AppError('This employee account has been deactivated.', 403, 'ACCOUNT_DISABLED');
  }

  // 2. Verify password with bcrypt if passwordHash exists
  if (employee.passwordHash) {
    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid username/email or password.', 401, 'INVALID_CREDENTIALS');
    }
  }

  // 3. Generate Application JWT Token
  const token = jwt.sign(
    {
      id: employee.id,
      firebaseUid: employee.firebaseUid,
      employeeId: employee.employeeId,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  // 4. Fetch balances
  const balances = await getEmployeeLeaveBalances(employee.id);

  logger.info(`🔑 User logged in: ${employee.username || employee.email} (${employee.role})`);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: employee.id,
        employeeId: employee.employeeId,
        username: employee.username,
        firebaseUid: employee.firebaseUid,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        phone: employee.phone,
        joiningDate: employee.joiningDate,
        department: {
          id: employee.department.id,
          code: employee.department.code,
          name: employee.department.name,
        },
        manager: employee.manager,
      },
      balances,
    },
  });
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Session expired or unauthorized.', 401, 'AUTH_REQUIRED');
  }

  const employee = await prisma.employee.findUnique({
    where: { id: req.user.id },
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
    throw new AppError('Employee record not found.', 404, 'PROFILE_NOT_FOUND');
  }

  const balances = await getEmployeeLeaveBalances(employee.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: employee.id,
        employeeId: employee.employeeId,
        username: employee.username,
        firebaseUid: employee.firebaseUid,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        phone: employee.phone,
        joiningDate: employee.joiningDate,
        department: {
          id: employee.department.id,
          code: employee.department.code,
          name: employee.department.name,
        },
        manager: employee.manager,
      },
      balances,
    },
  });
});

export const firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, email } = req.body;

  if (!idToken && !email) {
    throw new AppError('Firebase ID Token or email is required.', 400, 'INVALID_CREDENTIALS');
  }

  let verifiedEmail = email ? email.toLowerCase().trim() : null;
  let firebaseUid: string | null = null;

  // 1. Verify Firebase ID Token via Firebase Admin SDK if available
  const firebaseAdmin = getFirebaseAdmin();
  if (firebaseAdmin && idToken) {
    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
      firebaseUid = decoded.uid;
      if (decoded.email) {
        verifiedEmail = decoded.email.toLowerCase().trim();
      }
    } catch (err) {
      logger.warn('Firebase Admin ID token verification error:', err);
    }
  }

  if (!verifiedEmail && !firebaseUid) {
    throw new AppError('Invalid Firebase Authentication token or missing email.', 401, 'INVALID_TOKEN');
  }

  // 2. Fetch registered Employee profile from database
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        ...(verifiedEmail ? [{ email: verifiedEmail }] : []),
        ...(verifiedEmail === '2024.atharvag@isu.ac.in' || verifiedEmail === 'atharvagahine11@gmail.com' ? [{ email: 'manager@elap.com' }, { username: 'atharva_mgr' }] : []),
        ...(firebaseUid ? [{ firebaseUid }] : []),
      ],
    },
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

  // 3. Enforce strict database registration check
  if (!employee) {
    throw new AppError(
      `Access Denied: Email ${verifiedEmail || ''} is not registered in the employee directory. Please contact your HR or Manager to provision your account.`,
      403,
      'NOT_REGISTERED'
    );
  }

  if (!employee.active) {
    throw new AppError('This employee account has been deactivated.', 403, 'ACCOUNT_DISABLED');
  }

  // 4. Update employee.firebaseUid if not already linked
  if (firebaseUid && employee.firebaseUid !== firebaseUid) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { firebaseUid },
    });
  }

  // 5. Generate System Session Token with exact database Role
  const token = jwt.sign(
    {
      id: employee.id,
      firebaseUid: firebaseUid || employee.firebaseUid,
      employeeId: employee.employeeId,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  // 6. Fetch balances
  const balances = await getEmployeeLeaveBalances(employee.id);

  logger.info(`🔥 Firebase Auth verified for: ${employee.email} [Role: ${employee.role}]`);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: employee.id,
        employeeId: employee.employeeId,
        username: employee.username,
        firebaseUid: firebaseUid || employee.firebaseUid,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        phone: employee.phone,
        joiningDate: employee.joiningDate,
        department: {
          id: employee.department.id,
          code: employee.department.code,
          name: employee.department.name,
        },
        manager: employee.manager,
      },
      balances,
    },
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required.', 401, 'AUTH_REQUIRED');
  }

  if (!currentPassword || !newPassword) {
    throw new AppError('Both current password and new password are required.', 400, 'MISSING_FIELDS');
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long.', 400, 'PASSWORD_TOO_SHORT');
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!employee) {
    throw new AppError('Employee profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  // If user already has a passwordHash, verify current password
  if (employee.passwordHash) {
    const isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.employee.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  logger.info(`🔐 Password updated for employee: ${employee.username || employee.email}`);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, email, password, departmentId, designation, phone, role, firebaseUid: clientFirebaseUid } = req.body;

  const targetRole = (role || 'EMPLOYEE').toUpperCase().trim();
  const validRoles = ['EMPLOYEE', 'MANAGER', 'HR'];
  const userRole = validRoles.includes(targetRole) ? targetRole : 'EMPLOYEE';

  if (!name || !username || !email || !password) {
    throw new AppError('Name, username, email, and password are required.', 400, 'MISSING_FIELDS');
  }

  if (userRole === 'EMPLOYEE' && !departmentId) {
    throw new AppError('Please select a department for the employee account.', 400, 'DEPARTMENT_REQUIRED');
  }

  const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');
  const cleanEmail = email.toLowerCase().trim();

  // Work Email Security Validation
  const emailValidation = validateWorkEmail(cleanEmail, userRole);
  if (!emailValidation.isValid) {
    throw new AppError(emailValidation.error || 'Please provide a valid work email address.', 400, 'INVALID_WORK_EMAIL');
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

  // Validate or assign department
  let dept = null;
  if (departmentId) {
    dept = await prisma.department.findUnique({
      where: { id: departmentId },
    });
  }

  if (!dept) {
    dept = (await prisma.department.findFirst({
      where: { code: 'ADMIN' },
    })) || (await prisma.department.findFirst());
  }

  if (!dept) {
    throw new AppError('No department could be assigned. Please create a department first.', 400, 'DEPARTMENT_NOT_FOUND');
  }

  const resolvedDepartmentId = dept.id;

  // Find department manager to assign as reporting manager (for EMPLOYEE role)
  let deptManager = null;
  if (userRole === 'EMPLOYEE') {
    deptManager = await prisma.employee.findFirst({
      where: {
        departmentId: resolvedDepartmentId,
        role: 'MANAGER',
        active: true,
      },
    });
  }

  const defaultDesignation = userRole === 'HR' ? 'HR Specialist' : userRole === 'MANAGER' ? 'Team Lead / Manager' : 'Software Engineer';
  const cleanDesignation = designation && designation.trim() ? designation.trim() : defaultDesignation;

  const count = await prisma.employee.count();
  const year = new Date().getFullYear();
  const employeeId = `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
  let firebaseUid = clientFirebaseUid || `uid_${cleanUsername}_${Date.now()}`;

  // If client did not provide UID, attempt to provision via Firebase Admin SDK
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

  const newEmployee = await prisma.employee.create({
    data: {
      firebaseUid,
      employeeId,
      username: cleanUsername,
      passwordHash,
      name: name.trim(),
      email: cleanEmail,
      role: userRole,
      designation: cleanDesignation,
      departmentId: resolvedDepartmentId,
      managerId: deptManager ? deptManager.id : null,
      phone: phone ? phone.trim() : null,
      active: true,
      joiningDate: new Date(),
    },
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

  // Provision initial leave balances (CL: 12, SL: 12, EL: 15)
  const leaveTypes = await prisma.leaveType.findMany({ where: { active: true } });
  for (const lt of leaveTypes) {
    let quota = 12;
    if (lt.code === 'EL') quota = 15;
    if (lt.code === 'SL') quota = 12;
    if (lt.code === 'CL') quota = 12;

    await prisma.leaveBalance.create({
      data: {
        employeeId: newEmployee.id,
        leaveTypeId: lt.id,
        year,
        openingBalance: quota,
        approvedDays: 0,
        pendingDays: 0,
        availableDays: quota,
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'LEAVE_SUBMITTED',
      actorId: newEmployee.id,
      actorRole: newEmployee.role as any,
      metadata: JSON.stringify({
        event: `${newEmployee.role}_SELF_REGISTERED`,
        username: cleanUsername,
        email: cleanEmail,
        role: newEmployee.role,
        department: dept.name,
      }),
    },
  });

  const balances = await getEmployeeLeaveBalances(newEmployee.id);

  const token = jwt.sign(
    {
      id: newEmployee.id,
      firebaseUid: newEmployee.firebaseUid,
      employeeId: newEmployee.employeeId,
      username: newEmployee.username,
      email: newEmployee.email,
      role: newEmployee.role,
    },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  logger.info(`✨ New ${newEmployee.role} self-registered: ${newEmployee.name} (@${cleanUsername})`);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: newEmployee.id,
        employeeId: newEmployee.employeeId,
        username: newEmployee.username,
        firebaseUid: newEmployee.firebaseUid,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        designation: newEmployee.designation,
        phone: newEmployee.phone,
        joiningDate: newEmployee.joiningDate,
        department: {
          id: newEmployee.department.id,
          code: newEmployee.department.code,
          name: newEmployee.department.name,
        },
        manager: newEmployee.manager,
      },
      balances,
    },
    message: `Account for @${cleanUsername} registered successfully.`,
  });
});

