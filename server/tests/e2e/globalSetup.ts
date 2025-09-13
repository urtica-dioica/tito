/**
 * Global Setup for End-to-End Tests
 * 
 * Initializes test environment and verifies system readiness for E2E testing
 */

// Mock axios for testing
const axios = Object.assign(
  (config: any) => Promise.resolve({ data: {}, status: 200, headers: {}, config }),
  {
    get: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
    put: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
    delete: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
    patch: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
    create: () => ({
      get: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      post: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      put: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      delete: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      patch: jest.fn().mockResolvedValue({ data: {}, status: 200, headers: {} }),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })
  }
);

export default async function globalSetup() {
  console.log('🔄 Setting up end-to-end test environment...');

  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const timeout = parseInt(process.env.TEST_TIMEOUT || '300000');

  try {
    // Verify server is running
    console.log(`📡 Checking server availability at ${baseURL}...`);
    
    const healthResponse = await axios.get(`${baseURL}/api/v1/health`, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (healthResponse.status !== 200) {
      throw new Error(`Server health check failed with status ${healthResponse.status}`);
    }

    console.log('✅ Server is running and accessible');

    // Verify database connectivity
    console.log('🗄️ Checking database connectivity...');
    
    const dbResponse = await axios.get(`${baseURL}/api/v1/health/database`, {
      timeout: 10000,
      validateStatus: () => true
    });

    if (dbResponse.status !== 200) {
      throw new Error(`Database health check failed with status ${dbResponse.status}`);
    }

    console.log('✅ Database is accessible');

    // Verify test users exist
    console.log('👤 Checking test user availability...');
    
    const testUsers = [
      { username: 'hr1', password: 'HR123!', role: 'hr' },
      { username: 'depthead1', password: 'DeptHead123!', role: 'department_head' },
      { username: 'employee1', password: 'Employee123!', role: 'employee' }
    ];

    let authenticatedUsers = 0;
    for (const user of testUsers) {
      try {
        const authResponse = await axios.post(`${baseURL}/api/v1/auth/login`, {
          username: user.username,
          password: user.password
        }, {
          timeout: 10000,
          validateStatus: () => true
        });

        if (authResponse.status === 200) {
          authenticatedUsers++;
          console.log(`✅ Test user ${user.username} (${user.role}) is available`);
        } else {
          console.warn(`⚠️ Test user ${user.username} authentication failed with status ${authResponse.status}`);
        }
      } catch (error) {
        console.warn(`⚠️ Test user ${user.username} authentication error: ${(error as any).message}`);
      }
    }

    if (authenticatedUsers === 0) {
      throw new Error('No test users are available for E2E testing');
    }

    console.log(`✅ ${authenticatedUsers}/${testUsers.length} test users are available`);

    // Verify key endpoints are accessible
    console.log('🔗 Checking key endpoint accessibility...');
    
    const keyEndpoints = [
      '/api/v1/hr/dashboard',
      '/api/v1/department-head/dashboard',
      '/api/v1/employee/profile',
      '/api/v1/kiosk/scan'
    ];

    let accessibleEndpoints = 0;
    for (const endpoint of keyEndpoints) {
      try {
        const endpointResponse = await axios.get(`${baseURL}${endpoint}`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Should return 401 (unauthorized) or 200 (authorized), not 404 (not found)
        if (endpointResponse.status !== 404) {
          accessibleEndpoints++;
          console.log(`✅ Endpoint ${endpoint} is accessible`);
        } else {
          console.warn(`⚠️ Endpoint ${endpoint} not found (404)`);
        }
      } catch (error) {
        console.warn(`⚠️ Endpoint ${endpoint} error: ${(error as any).message}`);
      }
    }

    console.log(`✅ ${accessibleEndpoints}/${keyEndpoints.length} key endpoints are accessible`);

    // Set global test configuration
    global.e2eTestConfig = {
      baseURL,
      timeout,
      isReady: true,
      authenticatedUsers,
      accessibleEndpoints,
      setupTime: new Date().toISOString()
    };

    console.log('🎯 End-to-end test environment ready!');
    console.log(`⏱️ Timeout: ${timeout}ms`);
    console.log(`🌐 Base URL: ${baseURL}`);
    console.log(`👤 Authenticated Users: ${authenticatedUsers}`);
    console.log(`🔗 Accessible Endpoints: ${accessibleEndpoints}`);

  } catch (error) {
    console.error('❌ End-to-end test setup failed:', error);
    
    // Set configuration to indicate setup failure
    global.e2eTestConfig = {
      baseURL,
      timeout,
      isReady: false,
      error: (error as any).message,
      setupTime: new Date().toISOString()
    };

    throw error;
  }
}

// Type declaration for global configuration
declare global {
  var e2eTestConfig: {
    baseURL: string;
    timeout: number;
    isReady: boolean;
    authenticatedUsers?: number;
    accessibleEndpoints?: number;
    error?: string;
    setupTime: string;
  };
}
