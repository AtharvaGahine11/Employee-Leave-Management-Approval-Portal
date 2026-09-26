import { Router } from 'express';
import { addAttachment, uploadMiddleware } from './attachmentController.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/leaves/:id/attachments', authMiddleware, uploadMiddleware.single('file'), addAttachment);

export default router;
