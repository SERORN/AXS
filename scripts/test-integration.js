#!/usr/bin/env node

/**
 * AXS360 Integration Test Suite
 * Tests all major functionality end-to-end
 * Run with: node scripts/test-integration.js
 */

// Configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3001/api',
  TEST_PHONE: process.env.TEST_PHONE || '+15005550006',
  TEST_EMAIL: process.env.TEST_EMAIL || 'test@axs360.com',
  TEST_NAME: process.env.TEST_NAME || 'Test User',
};

let authToken = '';
let testUserId = '';

// Utility functions
const log = {
  info: (msg) => console.log('ℹ️  ' + msg),
  success: (msg) => console.log('✅ ' + msg),
  error: (msg) => console.log('❌ ' + msg),
  warn: (msg) => console.log('⚠️  ' + msg),
  test: (name) => console.log('\n🧪 Testing: ' + name)
};

// Simple HTTP client (replacing axios dependency)
async function httpRequest(method, url, data = null, headers = {}) {
  const https = require('https');
  const http = require('http');
  const urlModule = require('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = urlModule.parse(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            data: parsedData,
            status: res.statusCode,
            statusText: res.statusMessage
          });
        } catch (e) {
          resolve({
            data: responseData,
            status: res.statusCode,
            statusText: res.statusMessage
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${CONFIG.API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Test Cases
const tests = {
  async healthCheck() {
    log.test('API Health Check');
    const response = await apiRequest('GET', '/health');
    if (response.success) {
      log.success('API is healthy');
      return true;
    }
    throw new Error('Health check failed');
  },

  async authentication() {
    log.test('Authentication Flow');
    
    // Send OTP
    log.info('Sending OTP...');
    await apiRequest('POST', '/auth/send-otp', {
      phone: CONFIG.TEST_PHONE
    });
    log.success('OTP sent successfully');

    // For testing, we'll use a mock verification
    // In real tests, you'd need to capture the OTP from Twilio
    log.warn('Skipping OTP verification in test mode');
    
    return true;
  },

  async userRegistration() {
    log.test('User Registration');
    
    try {
      const response = await apiRequest('POST', '/auth/register', {
        name: CONFIG.TEST_NAME,
        email: CONFIG.TEST_EMAIL,
        phone: CONFIG.TEST_PHONE
      });
      
      if (response.data?.token) {
        authToken = response.data.token;
        testUserId = response.data.user.id;
        log.success('User registered successfully');
        return true;
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        log.warn('User already exists, attempting login...');
        return await this.userLogin();
      }
      throw error;
    }
  },

  async userLogin() {
    log.test('User Login');
    
    const response = await apiRequest('POST', '/auth/verify-otp', {
      phone: CONFIG.TEST_PHONE,
      code: '123456' // Mock code for testing
    });
    
    if (response.data?.token) {
      authToken = response.data.token;
      testUserId = response.data.user.id;
      log.success('User logged in successfully');
      return true;
    }
    throw new Error('Login failed');
  },

  async getCurrentUser() {
    log.test('Get Current User');
    
    const response = await apiRequest('GET', '/auth/me');
    if (response.data?.user) {
      log.success(`Retrieved user: ${response.data.user.name}`);
      return true;
    }
    throw new Error('Failed to get current user');
  },

  async walletOperations() {
    log.test('Wallet Operations');
    
    // Get balance
    log.info('Checking wallet balance...');
    const balanceResponse = await apiRequest('GET', '/wallet/balance');
    log.success(`Current balance: ${balanceResponse.data.formattedBalance}`);
    
    // Test top-up creation (won't complete payment in test)
    log.info('Testing wallet top-up creation...');
    const topUpResponse = await apiRequest('POST', '/wallet/topup', {
      amount: 2500, // $25.00
      currency: 'USD'
    });
    
    if (topUpResponse.data?.clientSecret) {
      log.success('Top-up payment intent created successfully');
    }
    
    return true;
  },

  async planOperations() {
    log.test('Plan Operations');
    
    // Get plans
    log.info('Fetching available plans...');
    const plansResponse = await apiRequest('GET', '/plans');
    const plans = plansResponse.data?.plans || [];
    log.success(`Found ${plans.length} plans`);
    
    if (plans.length > 0) {
      log.info(`First plan: ${plans[0].name} - $${plans[0].price}`);
    }
    
    // Get user plans
    log.info('Fetching user plans...');
    const userPlansResponse = await apiRequest('GET', '/plans/user');
    const userPlans = userPlansResponse.data?.plans || [];
    log.success(`User has ${userPlans.length} active plans`);
    
    return true;
  },

  async paymentOperations() {
    log.test('Payment Operations');
    
    // Create payment intent
    log.info('Creating payment intent...');
    const paymentResponse = await apiRequest('POST', '/payments/create', {
      amount: 1000, // $10.00
      type: 'wallet_topup'
    });
    
    if (paymentResponse.data?.clientSecret) {
      log.success('Payment intent created successfully');
    }
    
    // Get payment history
    log.info('Fetching payment history...');
    const historyResponse = await apiRequest('GET', '/payments/history');
    const transactions = historyResponse.data?.transactions || [];
    log.success(`Found ${transactions.length} transactions`);
    
    return true;
  },

  async adminOperations() {
    log.test('Admin Operations (if admin user)');
    
    try {
      // Try to access admin stats
      const statsResponse = await apiRequest('GET', '/admin/stats');
      if (statsResponse.data) {
        log.success('Admin stats retrieved successfully');
        log.info(`Total users: ${statsResponse.data.users.total}`);
        log.info(`Total revenue: $${statsResponse.data.revenue.total}`);
      }
    } catch (error) {
      if (error.message.includes('permission') || error.message.includes('admin')) {
        log.warn('User is not an admin - skipping admin tests');
        return true;
      }
      throw error;
    }
    
    return true;
  }
};

// Test runner
async function runTests() {
  console.log('🚀'.rainbow + ' AXS360 Integration Test Suite\n'.rainbow.bold);
  
  const testResults = [];
  const testNames = Object.keys(tests);
  
  for (const testName of testNames) {
    try {
      await tests[testName]();
      testResults.push({ name: testName, status: 'PASS' });
    } catch (error) {
      log.error(`${testName} failed: ${error.message}`);
      testResults.push({ name: testName, status: 'FAIL', error: error.message });
    }
    
    // Add delay between tests
    await sleep(1000);
  }
  
  // Print summary
  console.log('\n📊'.blue + ' Test Results Summary\n'.blue.bold);
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(result => {
    const status = result.status === 'PASS' 
      ? '✅ PASS'.green 
      : '❌ FAIL'.red;
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`.gray);
    }
  });
  
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your AXS360 platform is working correctly.'.green.bold);
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.'.yellow.bold);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, tests };
