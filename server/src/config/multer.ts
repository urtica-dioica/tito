import multer from 'multer';
import path from 'path';
import { config } from './environment';
import logger from '../utils/logger';

// Configure storage for selfie images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), config.upload.path);
    cb(null, uploadPath);
  },
  filename: (req, _file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const employeeCode = req.body.employeeCode || req.body.employeeId || 'unknown';
    const sessionType = req.body.sessionType || 'unknown';
    
    const filename = `selfie_${employeeCode}_${sessionType}_${timestamp}.jpg`;
    cb(null, filename);
  }
});

// File filter to only allow image files
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file
  }
});

// Middleware for single selfie upload
export const uploadSelfie = upload.single('selfie');

// Error handling middleware for multer
export const handleMulterError = (error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.',
        error: 'TOO_MANY_FILES'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  logger.error('Multer error:', error);
  next(error);
};

export default upload;
