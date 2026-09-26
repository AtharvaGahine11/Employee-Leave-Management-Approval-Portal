import { Role } from './enums.js';

export interface AuthUser {
  id: string; // Employee UUID
  firebaseUid: string;
  employeeId: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string;
  managerId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
