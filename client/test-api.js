// Simple test script for testing API connection
import axios from 'axios';

// API test function
const testAPI = async (apiUrl) => {
  console.log(`Testing API connection to: ${apiUrl}`);

  try {
    // Test status endpoint
    console.log('1. Testing status endpoint...');
    const statusResponse = await axios.get(`${apiUrl}/status`);
    console.log('✅ Status response:', statusResponse.data);

    // Test special test login endpoint
    console.log('2. Testing test-login endpoint...');
    const loginResponse = await axios.post(`${apiUrl}/test-login`, {
      testField: 'This is a test request from client',
    });
    console.log('✅ Login response:', loginResponse.data);

    // Try a real login
    console.log('3. Testing real login endpoint...');
    const realLoginResponse = await axios.post(`${apiUrl}/auth/login`, {
      email: 'user@roadbook.com',
      password: 'Password123!',
    });
    console.log('✅ Real login response:', realLoginResponse.data);

    console.log('ALL TESTS PASSED! 🎉 API connection successful!');
    return true;
  } catch (error) {
    console.error('❌ API TEST FAILED!');
    if (error.response) {
      console.error('Server responded with error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('No response received from server. Network issue or CORS problem.');
      console.error('Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    console.error('Full error:', error);
    return false;
  }
};

// Run only when imported directly in Node.js
// eslint-disable-next-line no-undef
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  // Default test URL from environment or use localhost
  // eslint-disable-next-line no-undef
  const API_URL = process.env.API_URL || 'http://localhost:4001/api';
  testAPI(API_URL);
}

export default testAPI;
