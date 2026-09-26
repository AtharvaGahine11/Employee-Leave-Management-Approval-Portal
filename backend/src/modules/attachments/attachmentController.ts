import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuditAction } from '../../types/enums.js';
import { logAudit } from '../audit/auditService.js';
import { uploadFileToStorage } from '../../services/storageService.js';
import multer from 'multer';

// Storage configuration using multer memory storage
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  },
});

export const addAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const uploaderId = req.user!.id;
  const file = req.file;

  if (!file) {
    throw new AppError('No file uploaded or invalid file format.', 400, 'INVALID_ATTACHMENT');
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Ownership check
  if (leaveRequest.employeeId !== uploaderId && req.user!.role !== 'HR') {
    throw new AppError('You are not authorized to upload attachments for this request.', 403, 'FORBIDDEN');
  }

  // Max 3 files check
  if (leaveRequest.attachments.length >= 3) {
    throw new AppError('Maximum 3 attachments allowed per leave request.', 400, 'MAX_ATTACHMENTS_EXCEEDED');
  }

  // Upload to Supabase Storage bucket (or fallback to base64 if credentials absent)
  const uploadResult = await uploadFileToStorage(file, id);

  const attachment = await prisma.attachment.create({
    data: {
      leaveRequestId: id,
      uploaderId,
      publicId: uploadResult.publicId,
      url: uploadResult.url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  });

  await logAudit({
    leaveRequestId: id,
    actorId: uploaderId,
    actorRole: req.user!.role,
    action: AuditAction.ATTACHMENT_UPLOADED,
    metadata: { fileName: file.originalname, size: file.size },
  });

  res.status(201).json({
    success: true,
    data: attachment,
  });
});
