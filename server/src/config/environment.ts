import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env['PORT'] || '3000'),
    host: process.env['HOST'] || 'localhost',
    nodeEnv: process.env['NODE_ENV'] || 'development',
  },

  // Frontend Configuration
  frontend: {
    port: parseInt(process.env['FRONTEND_PORT'] || '3001'),
    host: process.env['FRONTEND_HOST'] || 'localhost',
    url: process.env['FRONTEND_URL'] || 'http://localhost:3001',
  },

  // Database Configuration (PostgreSQL)
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    name: process.env['DB_NAME'] || 'tito_hr',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    ssl: process.env['DB_SSL'] === 'true',
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },

  // Redis Configuration
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0'),
  },

  // JWT Configuration
  jwt: {
    secret: process.env['JWT_SECRET'] || 'dev-secret-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  },

  // Email Configuration
  email: {
    host: process.env['EMAIL_HOST'] || 'smtp.gmail.com',
    port: parseInt(process.env['EMAIL_PORT'] || '587'),
    user: process.env['EMAIL_USER'] || '',
    pass: process.env['EMAIL_PASS'] || '',
    from: process.env['EMAIL_FROM'] || 'noreply@tito-hr.com',
  },

  // File Upload Configuration
  upload: {
    maxSize: parseInt(process.env['UPLOAD_MAX_SIZE'] || '5242880'), // 5MB
    path: process.env['UPLOAD_PATH'] || './uploads',
    selfieRetentionDays: parseInt(process.env['SELFIE_RETENTION_DAYS'] || '2'),
  },

  // Logging Configuration
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || './logs/app.log',
  },

  // CORS Configuration
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = process.env['CORS_ORIGIN'] 
        ? process.env['CORS_ORIGIN'].split(',').map(origin => origin.trim())
        : ['http://localhost:3001', 'http://localhost:5173'];
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: process.env['CORS_CREDENTIALS'] === 'true',
  },

  // API Configuration
  api: {
    prefix: process.env['API_PREFIX'] || '/api',
    version: process.env['API_VERSION'] || 'v1',
  },

  // Health Check Configuration
  healthCheck: {
    interval: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000'),
    timeout: parseInt(process.env['HEALTH_CHECK_TIMEOUT'] || '5000'),
  },
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  // Only require JWT_SECRET for development
  const required = process.env['NODE_ENV'] === 'production' ? [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ] : [
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Check if we're in production
export const isProduction = (): boolean => config.server.nodeEnv === 'production';
export const isDevelopment = (): boolean => config.server.nodeEnv === 'development';
export const isTest = (): boolean => config.server.nodeEnv === 'test'; 