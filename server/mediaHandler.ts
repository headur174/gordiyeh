import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { requireAdminAuth } from './cmsApi';

export const mediaRouter = Router();

// Memory storage for inspection, conversion, and validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('InvalidFileType: Only JPEG, PNG, and WebP images are permitted'));
    }
  },
});

const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/admin/media/upload
 * Requires Admin Role; Converts to WebP; Extracts exact width/height via sharp
 */
mediaRouter.post(
  '/upload',
  requireAdminAuth,
  (req: Request, res: Response, next) => {
    upload.any()(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'PayloadTooLarge: Maximum allowed image size is 5MB' });
        }
        return res.status(400).json({ error: `UploadError: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'BadRequest: No image file provided' });
      }

      // Process image using sharp: convert to webp and extract geometry
      const imageInstance = sharp(file.buffer);
      const metadata = await imageInstance.metadata();

      const width = metadata.width || 800;
      const height = metadata.height || 600;

      const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
      const targetPath = path.join(uploadsDir, filename);

      await imageInstance
        .webp({ quality: 85 })
        .toFile(targetPath);

      const publicUrl = `/uploads/${filename}`;

      return res.status(201).json({
        success: true,
        data: {
          url: publicUrl,
          width,
          height,
          format: 'webp',
          sizeBytes: file.size,
        },
        url: publicUrl,
        width,
        height,
        format: 'webp',
        sizeBytes: file.size,
      });
    } catch (err: any) {
      console.error('[Media:Upload] Error processing image:', err);
      return res.status(500).json({
        error: 'InternalServerError: Failed to process and convert image asset',
      });
    }
  }
);
