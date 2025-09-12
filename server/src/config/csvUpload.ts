import multer from 'multer';
import path from 'path';
import { config } from './environment';
import logger from '../utils/logger';

// Configure storage for CSV files
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(process.cwd(), config.upload.path, 'csv');
    cb(null, uploadPath);
  },
  filename: (_req, _file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `employees_bulk_${timestamp}.csv`;
    cb(null, filename);
  }
});

// File filter to only allow CSV files
const csvFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is a CSV
  if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'));
  }
};

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CSV files
    files: 1 // Only allow 1 file
  }
});

// Middleware for single CSV upload
export const uploadCSV = csvUpload.single('csvFile');

// Error handling middleware for CSV uploads
export const handleCSVUploadError = (error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one CSV file is allowed.',
        error: 'TOO_MANY_FILES'
      });
    }
  }
  
  if (error.message === 'Only CSV files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only CSV files are allowed.',
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  logger.error('CSV upload error:', error);
  next(error);
};

export default csvUpload;
