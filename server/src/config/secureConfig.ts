import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export const secureConfig = {
  database: {
    password: process.env.DB_PASSWORD || 'default_secure_password',
    ssl: process.env.DB_SSL === 'true'
  },
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex')
  },
  email: {
    password: process.env.EMAIL_PASSWORD,
    apiKey: process.env.EMAIL_API_KEY
  }
};

// Validate required secrets
const requiredSecrets = ['DB_PASSWORD', 'JWT_SECRET', 'EMAIL_PASSWORD'];
requiredSecrets.forEach(secret => {
  if (!process.env[secret]) {
    throw new Error(`Required environment variable ${secret} is not set`);
  }
});