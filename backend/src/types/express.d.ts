/// <reference types="multer" />
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
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
    interface Request {
      user?: AuthUser;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}
