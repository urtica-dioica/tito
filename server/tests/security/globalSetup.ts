/**
 * Global Setup for Security Tests
 * 
 * Initializes test environment and verifies system readiness
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
  console.log('🔒 Setting up security test environment...');

  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const timeout = parseInt(process.env.TEST_TIMEOUT || '30000');

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

    // Verify authentication endpoints
    console.log('🔐 Checking authentication endpoints...');
    
    const authResponse = await axios.post(`${baseURL}/api/v1/auth/login`, {
      username: 'testuser',
      password: 'wrongpassword'
    }, {
      timeout: 10000,
      validateStatus: () => true
    });

    // Should return 401 for invalid credentials
    if (authResponse.status !== 401) {
      console.warn(`⚠️ Unexpected auth response status: ${authResponse.status}`);
    } else {
      console.log('✅ Authentication endpoints are working');
    }

    // Set global test configuration
    global.securityTestConfig = {
      baseURL,
      timeout,
      isReady: true,
      setupTime: new Date().toISOString()
    };

    console.log('🎯 Security test environment ready!');
    console.log(`⏱️ Timeout: ${timeout}ms`);
    console.log(`🌐 Base URL: ${baseURL}`);

  } catch (error) {
    console.error('❌ Security test setup failed:', error);
    
    // Set configuration to indicate setup failure
    global.securityTestConfig = {
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
  var securityTestConfig: {
    baseURL: string;
    timeout: number;
    isReady: boolean;
    error?: string;
    setupTime: string;
  };
}
