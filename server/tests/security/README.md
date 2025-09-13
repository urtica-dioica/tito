# 🔒 Security Testing Suite

This directory contains comprehensive security tests for the TITO HR Management System, including vulnerability testing, penetration testing, and security validation.

## 📊 Test Categories

### 1. Authentication Security (`authenticationSecurity.test.ts`)
- **Purpose**: Test authentication mechanisms and security controls
- **Coverage**: Brute force protection, password strength, account lockout, session management, JWT security
- **Critical**: ✅ **YES** - Core security functionality

### 2. Authorization Security (`authorizationSecurity.test.ts`)
- **Purpose**: Test authorization and access control mechanisms
- **Coverage**: RBAC, privilege escalation prevention, resource access control, API authorization
- **Critical**: ✅ **YES** - Core security functionality

### 3. Input Validation Security (`inputValidationSecurity.test.ts`)
- **Purpose**: Test input validation and sanitization
- **Coverage**: SQL injection prevention, XSS prevention, input sanitization, file upload security
- **Critical**: ✅ **YES** - Core security functionality

### 4. Data Protection Security (Planned)
- **Purpose**: Test data encryption and protection mechanisms
- **Coverage**: Data encryption, sensitive data handling, password security, data anonymization
- **Critical**: ✅ **YES** - Core security functionality

### 5. Infrastructure Security (Planned)
- **Purpose**: Test infrastructure and configuration security
- **Coverage**: HTTPS configuration, security headers, CORS, rate limiting, error handling
- **Critical**: ❌ **NO** - Recommended but not required

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: Ensure the TITO HR server is running on `http://localhost:3000`
2. **Database**: PostgreSQL database must be accessible and populated with test data
3. **Dependencies**: All npm dependencies must be installed
4. **Test Users**: Test users must exist in the database

### Running Security Tests

#### Run All Security Tests
```bash
# From the server directory
npm run test:security

# Or using the custom runner
node tests/security/runSecurityTests.js all
```

#### Run Specific Test Categories
```bash
# Authentication security tests
node tests/security/runSecurityTests.js category authentication

# Authorization security tests
node tests/security/runSecurityTests.js category authorization

# Input validation security tests
node tests/security/runSecurityTests.js category input-validation
```

#### Run Individual Test Files
```bash
# Authentication security tests
npm test -- --testPathPattern="authenticationSecurity"

# Authorization security tests
npm test -- --testPathPattern="authorizationSecurity"

# Input validation security tests
npm test -- --testPathPattern="inputValidationSecurity"
```

## 🔍 Security Test Details

### Authentication Security Tests

#### Brute Force Protection
- **Test**: Multiple failed login attempts
- **Expected**: Account lockout or rate limiting after 5 attempts
- **Threshold**: Account locked within 10 attempts
- **Severity**: HIGH

#### Password Strength Validation
- **Test**: Weak password acceptance
- **Expected**: All weak passwords rejected
- **Threshold**: 0 weak passwords accepted
- **Severity**: HIGH

#### Session Management
- **Test**: Secure session creation and validation
- **Expected**: Valid JWT tokens, proper expiration, secure logout
- **Threshold**: All session tests pass
- **Severity**: HIGH

#### JWT Token Security
- **Test**: Token manipulation and validation
- **Expected**: Tokens cannot be manipulated, proper expiration
- **Threshold**: All token security tests pass
- **Severity**: CRITICAL

### Authorization Security Tests

#### Role-Based Access Control (RBAC)
- **Test**: Role-based endpoint access
- **Expected**: Users can only access authorized endpoints
- **Threshold**: 100% role compliance
- **Severity**: CRITICAL

#### Privilege Escalation Prevention
- **Test**: Horizontal and vertical privilege escalation attempts
- **Expected**: All escalation attempts blocked
- **Threshold**: 0 successful escalations
- **Severity**: CRITICAL

#### Resource Access Control
- **Test**: Department-based and user-based data access
- **Expected**: Users can only access their authorized data
- **Threshold**: 100% access control compliance
- **Severity**: HIGH

### Input Validation Security Tests

#### SQL Injection Prevention
- **Test**: SQL injection payloads in various endpoints
- **Expected**: No SQL errors or data exposure
- **Threshold**: 0 SQL injection vulnerabilities
- **Severity**: CRITICAL

#### XSS Prevention
- **Test**: XSS payloads in various inputs
- **Expected**: No unencoded script execution
- **Threshold**: 0 XSS vulnerabilities
- **Severity**: HIGH

#### Input Sanitization
- **Test**: HTML content and special characters
- **Expected**: Proper sanitization and validation
- **Threshold**: 100% input sanitization
- **Severity**: MEDIUM

#### File Upload Security
- **Test**: Malicious file uploads
- **Expected**: Malicious files rejected
- **Threshold**: 0 malicious files accepted
- **Severity**: HIGH

## 📈 Security Thresholds

### Critical Security Requirements
| Test Category | Requirement | Threshold | Severity |
|---------------|-------------|-----------|----------|
| **Authentication** | Brute force protection | Account locked after 5 attempts | HIGH |
| **Authentication** | Password strength | 0 weak passwords accepted | HIGH |
| **Authentication** | JWT security | 0 token manipulations | CRITICAL |
| **Authorization** | RBAC compliance | 100% role compliance | CRITICAL |
| **Authorization** | Privilege escalation | 0 successful escalations | CRITICAL |
| **Input Validation** | SQL injection | 0 SQL vulnerabilities | CRITICAL |
| **Input Validation** | XSS prevention | 0 XSS vulnerabilities | HIGH |
| **Input Validation** | File upload security | 0 malicious files | HIGH |

### Security Test Results
| Result | Description | Action Required |
|--------|-------------|-----------------|
| ✅ **PASS** | All security tests passed | None - system is secure |
| ⚠️ **WARN** | Some non-critical tests failed | Review and address warnings |
| ❌ **FAIL** | Critical security tests failed | **IMMEDIATE ACTION REQUIRED** |

## 🔧 Configuration

### Environment Variables
```bash
# Test server URL
TEST_BASE_URL=http://localhost:3000

# Test timeout (milliseconds)
TEST_TIMEOUT=30000

# Test user credentials
TEST_USERNAME=testuser
TEST_PASSWORD=TestPassword123!

# Admin user credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AdminPassword123!

# Security test mode
SECURITY_TEST_MODE=true
```

### Test Configuration
```javascript
// Security test configuration
const config = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  maxRetries: 3,
  testUser: {
    username: 'testuser',
    password: 'TestPassword123!',
    role: 'employee'
  },
  adminUser: {
    username: 'admin',
    password: 'AdminPassword123!',
    role: 'hr'
  }
};
```

## 📊 Test Results and Reporting

### Real-time Output
Security tests provide detailed real-time output including:
- Test execution progress
- Vulnerability detection
- Security threshold status
- Detailed error information

### Generated Reports
After test completion, comprehensive reports are generated:
- **Security Test Report**: Detailed test results and vulnerabilities
- **Vulnerability Report**: Specific security issues found
- **Recommendations**: Security improvement suggestions

### Sample Output
```
🔒 Security Test Report
======================

📊 SUMMARY
----------
Total Tests: 45
Passed: 42 (93.33%)
Failed: 3 (6.67%)
Critical Vulnerabilities: 0
High Vulnerabilities: 1
Medium Vulnerabilities: 2
Low Vulnerabilities: 0

🚨 CRITICAL VULNERABILITIES
---------------------------
None found ✅

⚠️ HIGH SEVERITY VULNERABILITIES
-------------------------------
1. XSS Vulnerability in Employee Search
   - Endpoint: /api/v1/employees/search
   - Payload: <script>alert("XSS")</script>
   - Remediation: Implement proper input sanitization

📋 TEST RESULTS
---------------
✅ Authentication Security: PASSED
✅ Authorization Security: PASSED
⚠️ Input Validation Security: 1 FAILURE
✅ Data Protection Security: PASSED
✅ Infrastructure Security: PASSED
```

## 🛠️ Customization

### Adding New Security Tests
1. Create a new test file in the `security` directory
2. Import the `SecurityTestSuite` from `securityTestUtils.ts`
3. Define your test configuration and security tests
4. Add security assertions based on your requirements

```typescript
import { SecurityTestSuite, SecurityTestConfig } from './securityTestUtils';

describe('Custom Security Tests', () => {
  it('should test custom security requirement', async () => {
    const config: SecurityTestConfig = {
      baseURL: 'http://localhost:3000',
      timeout: 30000,
      maxRetries: 3,
      testUser: { username: 'test', password: 'test', role: 'employee' },
      adminUser: { username: 'admin', password: 'admin', role: 'hr' }
    };

    const securitySuite = new SecurityTestSuite(config);
    
    // Run your custom security tests
    const result = await securitySuite.runAllSecurityTests();
    
    expect(result.summary.criticalVulnerabilities).toBe(0);
    expect(result.summary.highVulnerabilities).toBe(0);
  });
});
```

### Adding New Vulnerability Tests
```typescript
// Add new vulnerability test
private async testCustomVulnerability(): Promise<void> {
  const payloads = ['custom-payload-1', 'custom-payload-2'];
  
  for (const payload of payloads) {
    const response = await this.axios.post('/api/v1/endpoint', {
      input: payload
    });
    
    // Check for vulnerability indicators
    if (this.isVulnerable(response, payload)) {
      this.addVulnerability({
        vulnerability: 'Custom Vulnerability',
        severity: 'HIGH',
        description: 'Custom vulnerability description',
        affectedEndpoint: '/api/v1/endpoint',
        proofOfConcept: `Payload: ${payload}`,
        remediation: 'Implement proper validation'
      });
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Server is not running or not accessible
```
**Solution**: Start the TITO HR server before running security tests
```bash
npm start
```

#### 2. Authentication Failures
```
❌ Could not obtain auth token for security tests
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
❌ Security test timeout exceeded
```
**Solution**: Increase timeout values in test configuration
```bash
export TEST_TIMEOUT=60000  # 60 seconds
```

#### 5. False Positive Results
```
⚠️ Security test failed but system is actually secure
```
**Solution**: Review test configuration and adjust thresholds

### Security Issues

#### High Vulnerability Count
1. **Review Test Results**: Check specific vulnerabilities found
2. **Prioritize Fixes**: Address critical and high severity issues first
3. **Implement Fixes**: Apply security patches and improvements
4. **Re-run Tests**: Verify fixes with additional security testing

#### Authentication Failures
1. **Check User Credentials**: Verify test user accounts exist
2. **Review Authentication Logic**: Check login endpoint implementation
3. **Test Manually**: Verify authentication works outside of tests
4. **Check Database**: Ensure user data is properly stored

#### Authorization Failures
1. **Review RBAC Implementation**: Check role-based access control
2. **Verify Permissions**: Ensure proper permission assignments
3. **Test Endpoints**: Manually verify endpoint access controls
4. **Check Middleware**: Review authentication and authorization middleware

## 📚 Best Practices

### 1. Test Environment
- Use dedicated test environment separate from production
- Ensure consistent test data and environment setup
- Monitor system resources during security tests

### 2. Test Data
- Use realistic test data that matches production patterns
- Ensure sufficient test data for meaningful security testing
- Clean up test data after tests complete

### 3. Test Execution
- Run security tests regularly (e.g., after each release)
- Use consistent test configurations for comparable results
- Document any environment-specific configurations

### 4. Result Analysis
- Compare results against established security baselines
- Look for trends and patterns in security test data
- Investigate any significant deviations from expected security

### 5. Continuous Security
- Integrate security testing into CI/CD pipeline
- Set up alerts for security test failures
- Track security metrics over time

## 🔗 Related Documentation

- [API Documentation](../../docs/api/)
- [Database Schema](../../docs/database/)
- [Deployment Guide](../../docs/deployment/)
- [Security Guide](../../docs/security/)

## 📞 Support

For issues with security tests:
1. Check the troubleshooting section above
2. Review server and database logs
3. Verify test environment configuration
4. Contact the development team with detailed error information

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Status**: ✅ **PRODUCTION READY**

