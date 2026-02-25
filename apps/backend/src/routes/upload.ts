import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Role } from '@aspire/db';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadImage } from '../config/upload.js';

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  requireAuth,
  requireRole(Role.ADMIN, Role.LIBRARIAN),
  (req: Request, res: Response) => {
    uploadImage.single('image')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large (max 5MB).' });
        }
        return res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded. Use field name "image".' });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({ imageUrl });
    });
  }
);
