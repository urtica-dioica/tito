#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.cyan}🧪 TITO HR Management System - Test Suite${colors.reset}\n`);

// Test configuration
const testConfigs = [
  {
    name: 'Unit Tests',
    command: 'npm run test -- --testPathPattern=tests/unit',
    description: 'Testing individual components and services'
  },
  {
    name: 'Integration Tests',
    command: 'npm run test -- --testPathPattern=tests/integration',
    description: 'Testing API endpoints and database interactions'
  },
  {
    name: 'End-to-End Tests',
    command: 'npm run test -- --testPathPattern=tests/e2e',
    description: 'Testing complete workflows and user journeys'
  },
  {
    name: 'All Tests with Coverage',
    command: 'npm run test:coverage',
    description: 'Running all tests with coverage report'
  }
];

async function runTests() {
  const results = [];
  
  for (const config of testConfigs) {
    console.log(`${colors.bold}${colors.blue}📋 ${config.name}${colors.reset}`);
    console.log(`${colors.yellow}${config.description}${colors.reset}\n`);
    
    try {
      console.log(`${colors.cyan}Running: ${config.command}${colors.reset}`);
      const startTime = Date.now();
      
      execSync(config.command, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      results.push({
        name: config.name,
        status: 'PASSED',
        duration: `${duration}s`
      });
      
      console.log(`${colors.green}✅ ${config.name} completed successfully in ${duration}s${colors.reset}\n`);
      
    } catch (error) {
      results.push({
        name: config.name,
        status: 'FAILED',
        duration: 'N/A',
        error: error.message
      });
      
      console.log(`${colors.red}❌ ${config.name} failed${colors.reset}\n`);
    }
  }
  
  // Print summary
  console.log(`${colors.bold}${colors.cyan}📊 Test Results Summary${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? 
      `${colors.green}✅ PASSED${colors.reset}` : 
      `${colors.red}❌ FAILED${colors.reset}`;
    
    console.log(`${result.name.padEnd(25)} ${status} ${result.duration}`);
    
    if (result.status === 'PASSED') {
      passedCount++;
    } else {
      failedCount++;
    }
  });
  
  console.log(`${colors.bold}${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}Total: ${results.length} test suites${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passedCount}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failedCount}${colors.reset}`);
  
  const successRate = ((passedCount / results.length) * 100).toFixed(1);
  console.log(`${colors.yellow}📈 Success Rate: ${successRate}%${colors.reset}\n`);
  
  if (failedCount === 0) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed! The system is ready for production.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  Some tests failed. Please review the errors above.${colors.reset}`);
  }
  
  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test execution interrupted by user${colors.reset}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}Test execution terminated${colors.reset}`);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`);
  process.exit(1);
});