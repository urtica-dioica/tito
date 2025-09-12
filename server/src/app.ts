/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { validateEnvironment } from './config/environment';

// Import Redis middleware
import { sessionMiddleware, trackSessionActivity } from './middleware/redis/sessionMiddleware';
import { createRedisRateLimit, rateLimitConfigs } from './middleware/redis/rateLimitMiddleware';
import { createCacheMiddleware, cacheConfigs } from './middleware/redis/cacheMiddleware';

// Import routes
import routes from './routes/index';

// Create Express app
const app = express();

// Validate environment variables
validateEnvironment();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:3000", "http://localhost:5173"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
console.log('CORS Origin:', config.cors.origin);
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined'));

// Serve static files from uploads directory with proper CORS
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:3001', 'http://localhost:5173'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
}, express.static('uploads'));

// Image API endpoint - returns image as base64 to avoid CORS issues
app.get('/api/image/*', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  // Set CORS headers - use the same origin logic as main CORS config
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:3001', 'http://localhost:5173'];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    // Extract the file path from the request
    let filePath = req.path.replace('/api/image', '');
    
    // Remove leading slash if present
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    // Construct the full file path
    const fullPath = path.join(__dirname, '..', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Read file and determine MIME type
    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Set appropriate headers and return image directly
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load image' });
  }
});

// Request ID middleware
app.use((req, _res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  next();
});

// Redis-based rate limiting
app.use(createRedisRateLimit(rateLimitConfigs.api));

// Redis-based session management (exclude kiosk routes, uploads, and image proxy)
app.use((req, res, next) => {
  // Skip session middleware for kiosk routes, uploads, and image proxy
  if (req.path.startsWith('/api/v1/kiosk') || req.path.startsWith('/uploads') || req.path.startsWith('/api/images')) {
    return next();
  }
  return sessionMiddleware(req, res, next);
});

// Redis-based response caching for static data
app.use('/api/hr/departments', createCacheMiddleware(cacheConfigs.medium));
app.use('/api/hr/employees', createCacheMiddleware(cacheConfigs.short));
app.use('/api/dept/employees', createCacheMiddleware(cacheConfigs.short));

// Session activity tracking (exclude kiosk routes, uploads, and image proxy)
app.use((req, res, next) => {
  // Skip session activity tracking for kiosk routes, uploads, and image proxy
  if (req.path.startsWith('/api/v1/kiosk') || req.path.startsWith('/uploads') || req.path.startsWith('/api/images')) {
    return next();
  }
  return trackSessionActivity(req, res, next);
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbHealth = await testConnection();
    let redisHealth = false;
    
    try {
      redisHealth = await testRedisConnection();
    } catch (error) {
      console.warn('Redis health check failed:', error);
      redisHealth = false;
    }
    
    const healthStatus = {
      status: dbHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv,
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        redis: redisHealth ? 'healthy' : 'unhealthy',
      },
      version: '1.0.0',
      message: dbHealth ? 'All services operational' : 'Server running in limited mode - database unavailable',
    };

    res.status(dbHealth ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Server running in limited mode - health check failed',
    });
  }
});

// Mount API routes
app.use('/', routes);



// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    path: req.originalUrl,
  });
});

// Error handling middleware (will be implemented)
// app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    const { schedulerService } = require('./services/scheduler/schedulerService');
    schedulerService.stop();
    console.log('⏰ Scheduler service stopped');
  } catch (error) {
    console.warn('⚠️  Failed to stop scheduler service:', error);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    const { schedulerService } = require('./services/scheduler/schedulerService');
    schedulerService.stop();
    console.log('⏰ Scheduler service stopped');
  } catch (error) {
    console.warn('⚠️  Failed to stop scheduler service:', error);
  }
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - server will start but database features will not work');
      console.warn('💡 Please ensure PostgreSQL is running and database "tito_hr" exists');
    } else {
      console.log('✅ Database connection successful');
    }

    // Test Redis connection
    let redisConnected = false;
    try {
      redisConnected = await testRedisConnection();
      if (redisConnected) {
        console.log('✅ Redis connection successful');
      }
    } catch (error) {
      console.warn('⚠️  Redis connection failed - continuing without cache');
      redisConnected = false;
    }

    // Start listening
    app.listen(config.server.port, config.server.host, () => {
      console.log(`🚀 TITO HR Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Health check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`🗄️  Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
      console.log(`🔴 Redis: ${config.redis.host}:${config.redis.port}`);
      
      // Start scheduler service
      try {
        const { schedulerService } = require('./services/scheduler/schedulerService');
        schedulerService.start();
        console.log(`⏰ Scheduler service started`);
      } catch (error) {
        console.warn('⚠️  Failed to start scheduler service:', error);
      }
      
      if (!dbConnected) {
        console.log('⚠️  Server started in limited mode - database features disabled');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.log('💡 Starting server in limited mode...');
    
    // Start server even if database fails
    app.listen(config.server.port, config.server.host, () => {
      console.log(`🚀 TITO HR Server running in LIMITED MODE on http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Health check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`⚠️  Database features are disabled - please check database connection`);
    });
  }
};

// Export app for testing
export default app;

// Start server if this file is run directly
if (require.main === module) {
  startServer();
} 