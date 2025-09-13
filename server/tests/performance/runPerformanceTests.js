#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Performance test configuration
const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 300000, // 5 minutes
  maxWorkers: 1,
  verbose: true,
  testTypes: {
    load: true,
    stress: true,
    benchmark: true,
    database: true
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (title) => {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
};

const logSubHeader = (title) => {
  log(`\n📊 ${title}`, 'blue');
  log('-'.repeat(40), 'blue');
};

// Check if server is running
const checkServerHealth = async () => {
  try {
    const response = await fetch(`${config.baseURL}/health`);
    if (response.ok) {
      log('✅ Server is running and healthy', 'green');
      return true;
    } else {
      log('❌ Server health check failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Server is not running or not accessible', 'red');
    log(`   Error: ${error.message}`, 'red');
    log(`   Make sure the server is running on ${config.baseURL}`, 'yellow');
    return false;
  }
};

// Run Jest tests
const runJestTests = (testPattern, testName) => {
  return new Promise((resolve, reject) => {
    logSubHeader(`Running ${testName}`);
    
    const jestArgs = [
      '--testPathPattern', testPattern,
      '--testTimeout', config.timeout.toString(),
      '--maxWorkers', config.maxWorkers.toString(),
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (config.verbose) {
      jestArgs.push('--verbose');
    }

    const jestProcess = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });

    jestProcess.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${testName} completed successfully`, 'green');
        resolve();
      } else {
        log(`❌ ${testName} failed with exit code ${code}`, 'red');
        reject(new Error(`${testName} failed`));
      }
    });

    jestProcess.on('error', (error) => {
      log(`❌ Error running ${testName}: ${error.message}`, 'red');
      reject(error);
    });
  });
};

// Generate performance report
const generateReport = (results) => {
  const reportPath = path.join(__dirname, 'performance-report.md');
  
  let report = `# Performance Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Test Configuration\n\n`;
  report += `- Base URL: ${config.baseURL}\n`;
  report += `- Timeout: ${config.timeout}ms\n`;
  report += `- Max Workers: ${config.maxWorkers}\n\n`;
  
  report += `## Test Results\n\n`;
  
  for (const [testType, result] of Object.entries(results)) {
    report += `### ${testType}\n\n`;
    report += `- Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- Duration: ${result.duration}ms\n`;
    if (result.error) {
      report += `- Error: ${result.error}\n`;
    }
    report += `\n`;
  }
  
  report += `## Performance Thresholds\n\n`;
  report += `### API Endpoints\n`;
  report += `- Authentication: < 2000ms\n`;
  report += `- Payroll: < 3000ms\n`;
  report += `- Employee: < 2500ms\n\n`;
  
  report += `### Database Queries\n`;
  report += `- User Auth: < 50ms\n`;
  report += `- Employee List: < 100ms\n`;
  report += `- Attendance Stats: < 150ms\n`;
  report += `- Payroll Summary: < 200ms\n\n`;
  
  report += `### Load Tests\n`;
  report += `- Average Response Time: < 2000ms\n`;
  report += `- Max Response Time: < 5000ms\n`;
  report += `- Error Rate: < 5%\n`;
  report += `- Requests/Second: > 10\n\n`;
  
  fs.writeFileSync(reportPath, report);
  log(`📄 Performance report generated: ${reportPath}`, 'cyan');
};

// Main performance test runner
const runPerformanceTests = async () => {
  logHeader('TITO HR Management System - Performance Tests');
  
  // Check server health
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    log('\n❌ Cannot run performance tests - server is not accessible', 'red');
    process.exit(1);
  }
  
  const results = {};
  const startTime = Date.now();
  
  try {
    // Run load tests
    if (config.testTypes.load) {
      const loadStartTime = Date.now();
      try {
        await runJestTests('authLoadTest|payrollLoadTest', 'Load Tests');
        results.load = {
          success: true,
          duration: Date.now() - loadStartTime
        };
      } catch (error) {
        results.load = {
          success: false,
          duration: Date.now() - loadStartTime,
          error: error.message
        };
      }
    }
    
    // Run database performance tests
    if (config.testTypes.database) {
      const dbStartTime = Date.now();
      try {
        await runJestTests('databasePerformanceTest', 'Database Performance Tests');
        results.database = {
          success: true,
          duration: Date.now() - dbStartTime
        };
      } catch (error) {
        results.database = {
          success: false,
          duration: Date.now() - dbStartTime,
          error: error.message
        };
      }
    }
    
    // Run benchmark tests
    if (config.testTypes.benchmark) {
      const benchmarkStartTime = Date.now();
      try {
        await runJestTests('performanceBenchmark', 'Performance Benchmark Tests');
        results.benchmark = {
          success: true,
          duration: Date.now() - benchmarkStartTime
        };
      } catch (error) {
        results.benchmark = {
          success: false,
          duration: Date.now() - benchmarkStartTime,
          error: error.message
        };
      }
    }
    
    // Generate final report
    const totalDuration = Date.now() - startTime;
    logHeader('Performance Test Summary');
    
    let allPassed = true;
    for (const [testType, result] of Object.entries(results)) {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const color = result.success ? 'green' : 'red';
      log(`${testType}: ${status} (${result.duration}ms)`, color);
      
      if (!result.success) {
        allPassed = false;
        log(`   Error: ${result.error}`, 'red');
      }
    }
    
    log(`\nTotal Duration: ${totalDuration}ms`, 'cyan');
    
    if (allPassed) {
      log('\n🎉 All performance tests passed!', 'green');
      generateReport(results);
      process.exit(0);
    } else {
      log('\n❌ Some performance tests failed', 'red');
      generateReport(results);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Performance test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('TITO HR Performance Test Runner', 'bright');
  log('Usage: node runPerformanceTests.js [options]', 'cyan');
  log('\nOptions:', 'yellow');
  log('  --help, -h          Show this help message');
  log('  --load-only         Run only load tests');
  log('  --database-only     Run only database performance tests');
  log('  --benchmark-only    Run only benchmark tests');
  log('  --url <url>         Set test base URL (default: http://localhost:3000)');
  log('  --timeout <ms>      Set test timeout (default: 300000)');
  log('  --verbose           Enable verbose output');
  process.exit(0);
}

// Parse command line arguments
if (args.includes('--load-only')) {
  config.testTypes = { load: true, stress: false, benchmark: false, database: false };
}
if (args.includes('--database-only')) {
  config.testTypes = { load: false, stress: false, benchmark: false, database: true };
}
if (args.includes('--benchmark-only')) {
  config.testTypes = { load: false, stress: false, benchmark: true, database: false };
}

const urlIndex = args.indexOf('--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  config.baseURL = args[urlIndex + 1];
}

const timeoutIndex = args.indexOf('--timeout');
if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
  config.timeout = parseInt(args[timeoutIndex + 1]);
}

if (args.includes('--verbose')) {
  config.verbose = true;
}

// Run the performance tests
runPerformanceTests().catch((error) => {
  log(`\n❌ Performance test runner failed: ${error.message}`, 'red');
  process.exit(1);
});

