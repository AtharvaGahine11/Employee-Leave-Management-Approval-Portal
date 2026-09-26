import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { getFirebaseAdmin } from '../config/firebase.js';
import { config } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { AuthUser } from '../types/express.js';
import { Role } from '../types/enums.js';
import { logger } from '../utils/logger.js';

// In-memory cache for user profiles (60-second TTL) to eliminate network roundtrip delays
interface CachedUser {
  user: AuthUser;
  expiresAt: number;
}
const userCache = new Map<string, CachedUser>();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or malformed token.', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    let decodedEmail: string | null = null;
    let decodedUid: string | null = null;
    let jwtPayload: any = null;

    // 1. Check if token is a demo/development JWT
    try {
      const payload: any = jwt.verify(token, config.jwtSecret);
      if (payload && payload.email) {
        decodedEmail = payload.email.toLowerCase().trim();
        decodedUid = payload.uid || payload.firebaseUid;
        jwtPayload = payload;
      }
    } catch (jwtErr) {
      // 2. If JWT fails and Firebase Admin is initialized, try Firebase token verification
      const firebaseAdmin = getFirebaseAdmin();
      if (firebaseAdmin) {
        try {
          const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
          decodedUid = decodedToken.uid;
          decodedEmail = decodedToken.email ? decodedToken.email.toLowerCase().trim() : null;
        } catch (fbErr) {
          logger.warn('Firebase token verification failed:', fbErr);
        }
      }
    }

    if (!decodedEmail && !decodedUid) {
      throw new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN');
    }

    const cacheKey = (decodedUid || decodedEmail)!;
    const now = Date.now();

    // 3. Fast Cache Hit check (0ms latency)
    const cached = userCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      req.user = cached.user;
      return next();
    }

    // 4. Load Employee profile from database
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(decodedUid ? [{ firebaseUid: decodedUid }] : []),
          ...(decodedEmail ? [{ email: decodedEmail }] : []),
        ],
      },
      include: {
        department: true,
      },
    });

    if (!employee) {
      throw new AppError('User profile not found in employee system.', 401, 'PROFILE_NOT_FOUND');
    }

    if (!employee.active) {
      throw new AppError('Employee account has been deactivated.', 403, 'ACCOUNT_DISABLED');
    }

    // 5. Attach authenticated user profile and cache for 60 seconds
    const authUser: AuthUser = {
      id: employee.id,
      firebaseUid: employee.firebaseUid,
      employeeId: employee.employeeId,
      email: employee.email,
      name: employee.name,
      role: employee.role as Role,
      departmentId: employee.departmentId,
      managerId: employee.managerId,
    };

    userCache.set(cacheKey, {
      user: authUser,
      expiresAt: now + 60_000,
    });

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
};
