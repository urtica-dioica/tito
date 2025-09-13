import { performance } from 'perf_hooks';

// Performance test setup
console.log('🚀 Setting up performance test environment...');

// Set performance test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
process.env.PERFORMANCE_TEST_MODE = 'true';

// Performance monitoring
const startTime = performance.now();

// Global performance test utilities
(global as any).performanceTestUtils = {
  startTime,
  getElapsedTime: () => performance.now() - startTime,
  
  // Performance thresholds
  thresholds: {
    api: {
      auth: {
        login: 2000,
        profile: 1000,
        refresh: 1500
      },
      payroll: {
        periods: 2000,
        records: 3000,
        summary: 2500,
        stats: 3000
      },
      employee: {
        listing: 2000,
        search: 2500,
        details: 1500
      }
    },
    database: {
      userAuth: 50,
      employeeList: 100,
      attendanceStats: 150,
      payrollSummary: 200,
      departmentStats: 100
    },
    loadTest: {
      averageResponseTime: 2000,
      maxResponseTime: 5000,
      errorRate: 0.05, // 5%
      requestsPerSecond: 10
    }
  },

  // Performance assertion helpers
  assertPerformance: (actual: number, threshold: number, testName: string) => {
    if (actual > threshold) {
      throw new Error(
        `Performance regression detected in ${testName}: ` +
        `Actual: ${actual.toFixed(2)}ms, Threshold: ${threshold}ms`
      );
    }
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  },

  // CPU usage monitoring
  getCPUUsage: () => {
    const usage = process.cpuUsage();
    return {
      user: usage.user,
      system: usage.system,
      total: usage.user + usage.system
    };
  }
};

// Performance test cleanup
process.on('exit', () => {
  const elapsedTime = (global as any).performanceTestUtils.getElapsedTime();
  const memoryUsage = (global as any).performanceTestUtils.getMemoryUsage();
  
  console.log('\n📊 Performance Test Summary:');
  console.log(`Total Test Duration: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Memory Usage: ${memoryUsage.heapUsed}MB heap, ${memoryUsage.rss}MB RSS`);
});

// Handle uncaught exceptions in performance tests
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in Performance Test:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.error('❌ Unhandled Rejection in Performance Test:', reason);
  process.exit(1);
});

console.log('✅ Performance test environment setup complete');
