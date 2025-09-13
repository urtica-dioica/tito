#!/usr/bin/env node

/**
 * Security Test Runner Script
 * 
 * Command-line interface for running security tests
 * Usage: node runSecurityTests.js [command] [options]
 */

const { spawn } = require('child_process');
const path = require('path');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Available commands
const commands = {
  all: 'Run all security tests',
  category: 'Run specific security test category',
  list: 'List available security test categories',
  help: 'Show help information'
};

// Security test categories
const categories = [
  'authentication',
  'authorization', 
  'input-validation',
  'data-protection',
  'infrastructure'
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

// Run Jest with security test configuration
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

    log(`🔒 Running security tests with Jest...`, 'cyan');
    log(`📋 Command: jest ${jestArgs.join(' ')}`, 'blue');

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });

    jest.on('close', (code) => {
      if (code === 0) {
        logSuccess('Security tests completed successfully');
        resolve(code);
      } else {
        logError(`Security tests failed with exit code ${code}`);
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
  log('🔒 Security Test Runner', 'bright');
  log('======================\n', 'bright');
  
  log('Usage:', 'cyan');
  log('  node runSecurityTests.js [command] [options]\n');
  
  log('Commands:', 'cyan');
  Object.entries(commands).forEach(([cmd, desc]) => {
    log(`  ${cmd.padEnd(12)} ${desc}`, 'yellow');
  });
  
  log('\nExamples:', 'cyan');
  log('  node runSecurityTests.js all', 'green');
  log('  node runSecurityTests.js category authentication', 'green');
  log('  node runSecurityTests.js category "input-validation"', 'green');
  log('  node runSecurityTests.js list', 'green');
  log('  node runSecurityTests.js help', 'green');
  
  log('\nSecurity Test Categories:', 'cyan');
  categories.forEach(category => {
    log(`  • ${category}`, 'yellow');
  });
  
  log('\nEnvironment Variables:', 'cyan');
  log('  TEST_BASE_URL     Target server URL (default: http://localhost:3000)', 'yellow');
  log('  TEST_TIMEOUT      Test timeout in milliseconds (default: 30000)', 'yellow');
  log('  TEST_USERNAME     Test user username (default: testuser)', 'yellow');
  log('  TEST_PASSWORD     Test user password (default: TestPassword123!)', 'yellow');
  log('  ADMIN_USERNAME    Admin user username (default: admin)', 'yellow');
  log('  ADMIN_PASSWORD    Admin user password (default: AdminPassword123!)', 'yellow');
};

// List available categories
const listCategories = () => {
  log('🔒 Available Security Test Categories:', 'bright');
  log('=====================================\n', 'bright');
  
  categories.forEach((category, index) => {
    const critical = ['authentication', 'authorization', 'input-validation'].includes(category);
    const status = critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
    log(`${index + 1}. ${category} ${status}`, 'yellow');
  });
  
  log('\n🔴 Critical categories must pass for system security', 'red');
  log('🟡 Optional categories are recommended but not required', 'yellow');
};

// Run all security tests
const runAllTests = async () => {
  log('🔒 Running all security tests...', 'bright');
  log('================================\n', 'bright');
  
  try {
    await runJest();
    logSuccess('All security tests completed successfully!');
  } catch (error) {
    logError('Security tests failed');
    process.exit(1);
  }
};

// Run specific category
const runCategory = async (categoryName) => {
  if (!categoryName) {
    logError('Category name is required');
    log('Usage: node runSecurityTests.js category <category-name>', 'yellow');
    listCategories();
    process.exit(1);
  }

  if (!categories.includes(categoryName)) {
    logError(`Unknown category: ${categoryName}`);
    log('Available categories:', 'yellow');
    listCategories();
    process.exit(1);
  }

  log(`🔒 Running ${categoryName} security tests...`, 'bright');
  log('==========================================\n', 'bright');
  
  try {
    const testPattern = `${categoryName}Security.test.ts`;
    await runJest(testPattern);
    logSuccess(`${categoryName} security tests completed successfully!`);
  } catch (error) {
    logError(`${categoryName} security tests failed`);
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
  
  const timeout = process.env.TEST_TIMEOUT || '30000';
  logInfo(`Timeout: ${timeout}ms`);
  
  logSuccess('Prerequisites check completed');
};

// Main execution
const main = async () => {
  log('🔒 TITO HR Security Test Runner', 'bright');
  log('===============================\n', 'bright');
  
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
  logError(`Security test runner failed: ${error.message}`);
  process.exit(1);
});

