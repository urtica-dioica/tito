#!/usr/bin/env node

// Simple test script to verify token refresh functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testTokenRefresh() {
  console.log('🧪 Testing Token Refresh Functionality\n');

  try {
    // Step 1: Login to get initial tokens
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'hr.admin@tito.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });

    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.data.user.email);

    // Step 2: Wait for access token to expire (simulate expiration)
    console.log('\n2️⃣ Simulating token expiration...');
    console.log('Waiting 2 seconds (simulating expired token)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Try to access a protected endpoint (this should trigger refresh)
    console.log('\n3️⃣ Testing protected endpoint (should auto-refresh)...');
    const protectedResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      withCredentials: true
    });

    console.log('✅ Protected endpoint accessed successfully');
    console.log('Profile:', protectedResponse.data.data.email);

    // Step 4: Try refresh endpoint directly
    console.log('\n4️⃣ Testing refresh endpoint directly...');
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true
    });

    console.log('✅ Token refresh successful');
    console.log('Refresh response:', refreshResponse.data.message);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('🔍 401 error details:', error.response.data);
    }
  }
}

// Run the test
testTokenRefresh();


