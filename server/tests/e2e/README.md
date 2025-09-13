# 🔄 End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the TITO HR Management System, including user workflow testing, business process validation, and system integration testing.

## 📊 Test Categories

### 1. User Workflows (`userWorkflowE2E.test.ts`)
- **Purpose**: Test complete user workflows across all user roles
- **Coverage**: HR, Department Head, Employee, and Kiosk user workflows
- **Critical**: ✅ **YES** - Core user functionality

### 2. Business Processes (`businessProcessE2E.test.ts`)
- **Purpose**: Test end-to-end business processes and workflows
- **Coverage**: Employee onboarding, payroll processing, leave management, attendance management
- **Critical**: ✅ **YES** - Core business functionality

### 3. System Integration (Planned)
- **Purpose**: Test system integration and cross-module functionality
- **Coverage**: Database integration, API integration, authentication integration, file upload integration
- **Critical**: ✅ **YES** - Core system functionality

### 4. Cross-Module Integration (Planned)
- **Purpose**: Test cross-module integration and data flow
- **Coverage**: HR-Employee, Department-Employee, Payroll-Attendance, Leave-Attendance integration
- **Critical**: ❌ **NO** - Recommended but not required

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: Ensure the TITO HR server is running on `http://localhost:3000`
2. **Database**: PostgreSQL database must be accessible and populated with test data
3. **Dependencies**: All npm dependencies must be installed
4. **Test Users**: Test users must exist in the database with proper roles and permissions

### Running End-to-End Tests

#### Run All E2E Tests
```bash
# From the server directory
npm run test:e2e

# Or using the custom runner
node tests/e2e/runE2ETests.js all
```

#### Run Specific Test Categories
```bash
# User workflow tests
node tests/e2e/runE2ETests.js category user-workflows

# Business process tests
node tests/e2e/runE2ETests.js category business-processes

# System integration tests
node tests/e2e/runE2ETests.js category system-integration
```

#### Run Individual Test Files
```bash
# User workflow E2E tests
npm test -- --testPathPattern="userWorkflowE2E"

# Business process E2E tests
npm test -- --testPathPattern="businessProcessE2E"
```

## 🔍 E2E Test Details

### User Workflow Tests

#### HR User Workflow
- **Test**: Complete HR user workflow from login to payroll generation
- **Steps**: Login → Dashboard → Create Department → Create Employee → Generate Payroll → View Report
- **Expected**: All steps complete successfully
- **Duration**: ~60 seconds
- **Critical**: ✅ **YES**

#### Department Head User Workflow
- **Test**: Complete Department Head user workflow
- **Steps**: Login → Dashboard → View Employees → Approve Leave → View Attendance
- **Expected**: All steps complete successfully
- **Duration**: ~60 seconds
- **Critical**: ✅ **YES**

#### Employee User Workflow
- **Test**: Complete Employee user workflow
- **Steps**: Login → Profile → Attendance → Submit Leave → View Paystubs → View ID Card
- **Expected**: All steps complete successfully
- **Duration**: ~60 seconds
- **Critical**: ✅ **YES**

#### Kiosk User Workflow
- **Test**: Complete Kiosk user workflow
- **Steps**: Scan QR → Clock In → Clock Out → View Summary
- **Expected**: All steps complete successfully
- **Duration**: ~60 seconds
- **Critical**: ✅ **YES**

### Business Process Tests

#### Employee Onboarding Process
- **Test**: Complete employee onboarding from creation to system access
- **Steps**: Create Department → Create User → Create Employee → Generate ID Card → Initialize Leave Balance → Set Benefits → Verify Access
- **Expected**: Employee can access system with all data properly set up
- **Duration**: ~120 seconds
- **Critical**: ✅ **YES**

#### Payroll Processing Process
- **Test**: Complete payroll processing from period creation to employee paystub
- **Steps**: Create Period → Generate Payroll → Review Records → Approve Payroll → Generate Report → Verify Paystub
- **Expected**: Payroll processed and employee can view paystub
- **Duration**: ~120 seconds
- **Critical**: ✅ **YES**

#### Leave Management Process
- **Test**: Complete leave management from submission to approval
- **Steps**: Submit Leave → Review by Department Head → Approve Leave → View Approved Leave → Update Balance → HR Report
- **Expected**: Leave approved and balance updated
- **Duration**: ~120 seconds
- **Critical**: ✅ **YES**

#### Attendance Management Process
- **Test**: Complete attendance management from clock in to payroll processing
- **Steps**: Clock In → Clock Out → View History → Department Summary → HR Report → Process for Payroll
- **Expected**: Attendance recorded and processed for payroll
- **Duration**: ~120 seconds
- **Critical**: ✅ **YES**

## 📈 E2E Test Thresholds

### Performance Thresholds
| Test Category | Max Duration | Success Rate | Critical |
|---------------|-------------|--------------|----------|
| **User Workflows** | 60 seconds | 100% | ✅ YES |
| **Business Processes** | 120 seconds | 100% | ✅ YES |
| **System Integration** | 180 seconds | 95% | ✅ YES |
| **Cross-Module Integration** | 240 seconds | 90% | ❌ NO |

### Test Result Requirements
| Result | Description | Action Required |
|--------|-------------|-----------------|
| ✅ **PASS** | All E2E tests passed | None - system workflows are functional |
| ⚠️ **WARN** | Some non-critical tests failed | Review and address warnings |
| ❌ **FAIL** | Critical E2E tests failed | **IMMEDIATE ACTION REQUIRED** |

## 🔧 Configuration

### Environment Variables
```bash
# Test server URL
TEST_BASE_URL=http://localhost:3000

# Test timeout (milliseconds)
TEST_TIMEOUT=300000

# Test user credentials
TEST_HR_USERNAME=hr1
TEST_HR_PASSWORD=HR123!

TEST_DEPT_HEAD_USERNAME=depthead1
TEST_DEPT_HEAD_PASSWORD=DeptHead123!

TEST_EMPLOYEE_USERNAME=employee1
TEST_EMPLOYEE_PASSWORD=Employee123!

# E2E test mode
E2E_TEST_MODE=true
```

### Test Configuration
```javascript
// E2E test configuration
const config = {
  baseURL: 'http://localhost:3000',
  timeout: 300000,
  maxRetries: 3,
  testUsers: {
    hr: { username: 'hr1', password: 'HR123!', role: 'hr' },
    departmentHead: { username: 'depthead1', password: 'DeptHead123!', role: 'department_head' },
    employee: { username: 'employee1', password: 'Employee123!', role: 'employee' }
  },
  testData: {
    department: { name: 'E2E Test Department', description: 'Test department' },
    employee: { name: 'E2E Test Employee', email: 'e2etest@example.com', position: 'Test Position' },
    payroll: { period: '2024-01', amount: 50000 }
  }
};
```

## 📊 Test Results and Reporting

### Real-time Output
E2E tests provide detailed real-time output including:
- Test execution progress
- Workflow step completion
- Business process validation
- System integration status

### Generated Reports
After test completion, comprehensive reports are generated:
- **E2E Test Report**: Detailed test results and workflow validation
- **Business Process Report**: Business process completion and validation
- **System Integration Report**: System integration and cross-module testing results

### Sample Output
```
🔄 End-to-End Test Report
========================

📊 SUMMARY
----------
Total Tests: 8
Passed: 8 (100.00%)
Failed: 0 (0.00%)
Success Rate: 100.00%

📋 TEST RESULTS
---------------
✅ HR User Workflow
- Status: PASSED
- Duration: 45.23s
- Steps: 6
- Errors: 0

✅ Department Head User Workflow
- Status: PASSED
- Duration: 38.67s
- Steps: 5
- Errors: 0

✅ Employee User Workflow
- Status: PASSED
- Duration: 42.15s
- Steps: 7
- Errors: 0

✅ Kiosk User Workflow
- Status: PASSED
- Duration: 28.34s
- Steps: 4
- Errors: 0

✅ Employee Onboarding Process
- Status: PASSED
- Duration: 98.45s
- Steps: 7
- Errors: 0

✅ Payroll Processing Process
- Status: PASSED
- Duration: 112.67s
- Steps: 6
- Errors: 0

✅ Leave Management Process
- Status: PASSED
- Duration: 89.23s
- Steps: 6
- Errors: 0

✅ Attendance Management Process
- Status: PASSED
- Duration: 95.78s
- Steps: 6
- Errors: 0
```

## 🛠️ Customization

### Adding New E2E Tests
1. Create a new test file in the `e2e` directory
2. Import the `E2ETestSuite` from `e2eTestUtils.ts`
3. Define your test configuration and workflow tests
4. Add E2E assertions based on your requirements

```typescript
import { E2ETestSuite, E2ETestConfig } from './e2eTestUtils';

describe('Custom E2E Tests', () => {
  it('should test custom workflow', async () => {
    const config: E2ETestConfig = {
      baseURL: 'http://localhost:3000',
      timeout: 300000,
      maxRetries: 3,
      testUsers: { /* user config */ },
      testData: { /* test data */ }
    };

    const e2eSuite = new E2ETestSuite(config);
    
    // Run your custom E2E tests
    const result = await e2eSuite.runAllE2ETests();
    
    expect(result.summary.passed).toBe(result.summary.totalTests);
  });
});
```

### Adding New Workflow Tests
```typescript
// Add new workflow test
private async testCustomWorkflow(): Promise<void> {
  const testName = 'Custom Workflow';
  const startTime = performance.now();
  const steps: E2ETestStep[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Custom action
    const step1 = await this.executeStep('Custom Step 1', async () => {
      const response = await this.axios.post('/api/v1/custom/endpoint', {
        data: 'test'
      });
      
      if (response.status !== 200) {
        throw new Error(`Custom step failed with status ${response.status}`);
      }
      
      return { status: response.status, data: response.data };
    });

    steps.push(step1);

    // Add more steps as needed

  } catch (error) {
    errors.push(error.message);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  this.addResult({
    testName,
    passed: errors.length === 0,
    duration,
    steps,
    errors,
    timestamp: new Date()
  });
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Server is not running or not accessible
```
**Solution**: Start the TITO HR server before running E2E tests
```bash
npm start
```

#### 2. Test Users Not Available
```
❌ No test users are available for E2E testing
```
**Solution**: Ensure test users exist in the database
```bash
# Run database seeding
npm run seed:test
```

#### 3. Database Connection Issues
```
❌ Database connection failed
```
**Solution**: Ensure PostgreSQL is running and accessible
```bash
# Check database connection
psql -h localhost -U your_username -d tito_hr
```

#### 4. Test Timeout Issues
```
❌ E2E test timeout exceeded
```
**Solution**: Increase timeout values in test configuration
```bash
export TEST_TIMEOUT=600000  # 10 minutes
```

#### 5. Workflow Step Failures
```
❌ Workflow step failed
```
**Solution**: Check individual step implementation and dependencies

### E2E Test Issues

#### High Test Failure Rate
1. **Review Test Results**: Check specific workflow failures
2. **Check Dependencies**: Ensure all required services are running
3. **Verify Test Data**: Ensure test data is properly set up
4. **Check Network**: Verify network connectivity and latency

#### Slow Test Execution
1. **Check Server Performance**: Monitor server resource usage
2. **Check Database Performance**: Verify database query performance
3. **Check Network Latency**: Monitor network connectivity
4. **Optimize Test Data**: Reduce test data size and complexity

#### Workflow Step Failures
1. **Check API Endpoints**: Verify all API endpoints are accessible
2. **Check Authentication**: Ensure test users can authenticate
3. **Check Permissions**: Verify test users have proper permissions
4. **Check Data Dependencies**: Ensure required data exists

## 📚 Best Practices

### 1. Test Environment
- Use dedicated test environment separate from production
- Ensure consistent test data and environment setup
- Monitor system resources during E2E tests

### 2. Test Data
- Use realistic test data that matches production patterns
- Ensure sufficient test data for meaningful E2E testing
- Clean up test data after tests complete

### 3. Test Execution
- Run E2E tests regularly (e.g., after each release)
- Use consistent test configurations for comparable results
- Document any environment-specific configurations

### 4. Result Analysis
- Compare results against established E2E baselines
- Look for trends and patterns in E2E test data
- Investigate any significant deviations from expected workflows

### 5. Continuous E2E Testing
- Integrate E2E testing into CI/CD pipeline
- Set up alerts for E2E test failures
- Track E2E test metrics over time

## 🔗 Related Documentation

- [API Documentation](../../docs/api/)
- [Database Schema](../../docs/database/)
- [Deployment Guide](../../docs/deployment/)
- [User Guides](../../docs/user-guides/)

## 📞 Support

For issues with E2E tests:
1. Check the troubleshooting section above
2. Review server and database logs
3. Verify test environment configuration
4. Contact the development team with detailed error information

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY**

