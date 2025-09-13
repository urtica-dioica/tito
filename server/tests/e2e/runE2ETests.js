#!/usr/bin/env node

/**
 * End-to-End Test Runner Script
 * 
 * Command-line interface for running E2E tests
 * Usage: node runE2ETests.js [command] [options]
 */

const { spawn } = require('child_process');
const path = require('path');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Available commands
const commands = {
  all: 'Run all end-to-end tests',
  category: 'Run specific E2E test category',
  list: 'List available E2E test categories',
  help: 'Show help information'
};

// E2E test categories
const categories = [
  'user-workflows',
  'business-processes',
  'system-integration',
  'cross-module-integration'
];

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

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logError = (message) => {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
};

const logSuccess = (message) => {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
};

const logWarning = (message) => {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
};

const logInfo = (message) => {
  console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
};

// Run Jest with E2E test configuration
const runJest = (testPattern = '', additionalArgs = []) => {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--config', path.join(__dirname, 'jest.config.js'),
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (testPattern) {
      jestArgs.push('--testPathPattern', testPattern);
    }

    jestArgs.push(...additionalArgs);

    log(`🔄 Running end-to-end tests with Jest...`, 'cyan');
    log(`📋 Command: jest ${jestArgs.join(' ')}`, 'blue');

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });

    jest.on('close', (code) => {
      if (code === 0) {
        logSuccess('End-to-end tests completed successfully');
        resolve(code);
      } else {
        logError(`End-to-end tests failed with exit code ${code}`);
        reject(new Error(`Jest exited with code ${code}`));
      }
    });

    jest.on('error', (error) => {
      logError(`Failed to start Jest: ${error.message}`);
      reject(error);
    });
  });
};

// Show help information
const showHelp = () => {
  log('🔄 End-to-End Test Runner', 'bright');
  log('========================\n', 'bright');
  
  log('Usage:', 'cyan');
  log('  node runE2ETests.js [command] [options]\n');
  
  log('Commands:', 'cyan');
  Object.entries(commands).forEach(([cmd, desc]) => {
    log(`  ${cmd.padEnd(12)} ${desc}`, 'yellow');
  });
  
  log('\nExamples:', 'cyan');
  log('  node runE2ETests.js all', 'green');
  log('  node runE2ETests.js category user-workflows', 'green');
  log('  node runE2ETests.js category "business-processes"', 'green');
  log('  node runE2ETests.js list', 'green');
  log('  node runE2ETests.js help', 'green');
  
  log('\nE2E Test Categories:', 'cyan');
  categories.forEach(category => {
    log(`  • ${category}`, 'yellow');
  });
  
  log('\nEnvironment Variables:', 'cyan');
  log('  TEST_BASE_URL           Target server URL (default: http://localhost:3000)', 'yellow');
  log('  TEST_TIMEOUT            Test timeout in milliseconds (default: 300000)', 'yellow');
  log('  TEST_HR_USERNAME        HR test user username (default: hr1)', 'yellow');
  log('  TEST_HR_PASSWORD        HR test user password (default: HR123!)', 'yellow');
  log('  TEST_DEPT_HEAD_USERNAME Department head test user username (default: depthead1)', 'yellow');
  log('  TEST_DEPT_HEAD_PASSWORD Department head test user password (default: DeptHead123!)', 'yellow');
  log('  TEST_EMPLOYEE_USERNAME  Employee test user username (default: employee1)', 'yellow');
  log('  TEST_EMPLOYEE_PASSWORD  Employee test user password (default: Employee123!)', 'yellow');
};

// List available categories
const listCategories = () => {
  log('🔄 Available End-to-End Test Categories:', 'bright');
  log('========================================\n', 'bright');
  
  categories.forEach((category, index) => {
    const critical = ['user-workflows', 'business-processes', 'system-integration'].includes(category);
    const status = critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
    log(`${index + 1}. ${category} ${status}`, 'yellow');
  });
  
  log('\n🔴 Critical categories must pass for system functionality', 'red');
  log('🟡 Optional categories are recommended but not required', 'yellow');
};

// Run all E2E tests
const runAllTests = async () => {
  log('🔄 Running all end-to-end tests...', 'bright');
  log('==================================\n', 'bright');
  
  try {
    await runJest();
    logSuccess('All end-to-end tests completed successfully!');
  } catch (error) {
    logError('End-to-end tests failed');
    process.exit(1);
  }
};

// Run specific category
const runCategory = async (categoryName) => {
  if (!categoryName) {
    logError('Category name is required');
    log('Usage: node runE2ETests.js category <category-name>', 'yellow');
    listCategories();
    process.exit(1);
  }

  if (!categories.includes(categoryName)) {
    logError(`Unknown category: ${categoryName}`);
    log('Available categories:', 'yellow');
    listCategories();
    process.exit(1);
  }

  log(`🔄 Running ${categoryName} end-to-end tests...`, 'bright');
  log('============================================\n', 'bright');
  
  try {
    const testPattern = `${categoryName}E2E.test.ts`;
    await runJest(testPattern);
    logSuccess(`${categoryName} end-to-end tests completed successfully!`);
  } catch (error) {
    logError(`${categoryName} end-to-end tests failed`);
    process.exit(1);
  }
};

// Check prerequisites
const checkPrerequisites = () => {
  log('🔍 Checking prerequisites...', 'cyan');
  
  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, '../../package.json');
  try {
    require(packageJsonPath);
    logSuccess('Found package.json');
  } catch (error) {
    logError('package.json not found. Please run from the server directory.');
    process.exit(1);
  }
  
  // Check environment variables
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  logInfo(`Target URL: ${baseURL}`);
  
  const timeout = process.env.TEST_TIMEOUT || '300000';
  logInfo(`Timeout: ${timeout}ms`);
  
  // Check test user configuration
  const hrUsername = process.env.TEST_HR_USERNAME || 'hr1';
  const deptHeadUsername = process.env.TEST_DEPT_HEAD_USERNAME || 'depthead1';
  const employeeUsername = process.env.TEST_EMPLOYEE_USERNAME || 'employee1';
  
  logInfo(`HR Test User: ${hrUsername}`);
  logInfo(`Department Head Test User: ${deptHeadUsername}`);
  logInfo(`Employee Test User: ${employeeUsername}`);
  
  logSuccess('Prerequisites check completed');
};

// Main execution
const main = async () => {
  log('🔄 TITO HR End-to-End Test Runner', 'bright');
  log('==================================\n', 'bright');
  
  checkPrerequisites();
  
  switch (command) {
    case 'all':
      await runAllTests();
      break;
      
    case 'category':
      const category = args[1];
      await runCategory(category);
      break;
      
    case 'list':
      listCategories();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  logError(`End-to-end test runner failed: ${error.message}`);
  process.exit(1);
});

