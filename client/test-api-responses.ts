// client/test-api-responses.ts
import apiClient, { API_URL } from './app/services/api/client';
import authApi from './app/services/api/auth.api';
import { roadbookApi } from './app/services/api/roadbook.api';
import { getItem, saveItem, STORAGE_KEYS } from './app/services/secureStorage';

// Simple test credentials - Replace with valid test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Helper to log results
const logResult = (testName: string, success: boolean, data: any, error?: any) => {
  console.log(`\n----- ${testName} -----`);
  console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (success) {
    console.log('Response data:', data);
  } else {
    console.log('Error:', error?.message || error);
    if (error?.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  console.log('-----------------------------\n');
};

// Test auth.api.getCurrentUser
const testGetCurrentUser = async () => {
  try {
    console.log('Testing getCurrentUser...');
    
    // Get token - this should be set after login
    const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (!token) {
      console.log('No access token found. Please login first.');
      return { success: false, error: 'No access token found' };
    }
    
    const userData = await authApi.getCurrentUser();
    return { success: true, data: userData };
  } catch (error) {
    return { success: false, error };
  }
};

// Test roadbookApi.getUserRoadbooks
const testGetUserRoadbooks = async () => {
  try {
    console.log('Testing getUserRoadbooks...');
    const roadbooks = await roadbookApi.getUserRoadbooks();
    return { success: true, data: roadbooks };
  } catch (error) {
    return { success: false, error };
  }
};

// Test login
const testLogin = async (email: string, password: string) => {
  try {
    console.log('Testing login...');
    const response = await authApi.login({ email, password });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error };
  }
};

// Test health endpoint
const testHealthEndpoint = async () => {
  try {
    console.log('Testing health endpoint...');
    const response = await apiClient.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error };
  }
};

// Run all tests
const runTests = async () => {
  console.log('=================================');
  console.log('RUNNING API RESPONSE TESTS');
  console.log('Using API URL:', API_URL);
  console.log('=================================\n');
  
  // First, test health endpoint
  const healthResult = await testHealthEndpoint();
  logResult('Health Endpoint', healthResult.success, healthResult.data, healthResult.error);
  
  // Test login (this will set the token for subsequent tests)
  const loginResult = await testLogin(TEST_EMAIL, TEST_PASSWORD);
  logResult('Login', loginResult.success, loginResult.data, loginResult.error);
  
  // If login successful, test authenticated endpoints
  if (loginResult.success) {
    // Test getCurrentUser
    const userResult = await testGetCurrentUser();
    logResult('Get Current User', userResult.success, userResult.data, userResult.error);
    
    // Test getUserRoadbooks
    const roadbooksResult = await testGetUserRoadbooks();
    logResult('Get User Roadbooks', roadbooksResult.success, roadbooksResult.data, roadbooksResult.error);
  }
  
  console.log('\n=================================');
  console.log('ALL TESTS COMPLETED');
  console.log('=================================');
};

// Execute tests
runTests().catch(err => {
  console.error('Test execution failed:', err);
});