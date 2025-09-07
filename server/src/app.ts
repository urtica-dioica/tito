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
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
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

// Request ID middleware
app.use((req, _res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  next();
});

// Redis-based rate limiting
app.use(createRedisRateLimit(rateLimitConfigs.api));

// Redis-based session management
app.use(sessionMiddleware);

// Redis-based response caching for static data
app.use('/api/hr/departments', createCacheMiddleware(cacheConfigs.medium));
app.use('/api/hr/employees', createCacheMiddleware(cacheConfigs.short));
app.use('/api/dept/employees', createCacheMiddleware(cacheConfigs.short));

// Session activity tracking
app.use(trackSessionActivity);

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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
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