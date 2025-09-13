/**
 * Jest Setup File
 * 
 * This file runs before each test file and sets up mocks and global configurations.
 */

import { mockRedisService } from './utils/mockRedisService';
import { mockDatabaseService } from './utils/mockDatabaseService';

// Mock the Redis service module
jest.mock('../src/services/redis/redisService', () => ({
  RedisService: jest.fn().mockImplementation(() => mockRedisService),
  redisService: mockRedisService
}));

// Mock the database service module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockDatabaseService),
  Client: jest.fn().mockImplementation(() => mockDatabaseService)
}));

// Mock the database config module
jest.mock('../src/config/database', () => ({
  getPool: jest.fn(() => mockDatabaseService)
}));

// Mock other external services that might cause issues in tests
jest.mock('../src/services/email/emailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true)
  }))
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined)
}));

// Mock multer for file uploads
jest.mock('multer', () => ({
  diskStorage: jest.fn(),
  memoryStorage: jest.fn(),
  __esModule: true,
  default: jest.fn(() => ({
    single: jest.fn(),
    array: jest.fn(),
    fields: jest.fn()
  }))
}));

// Global test timeout
jest.setTimeout(30000);

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
