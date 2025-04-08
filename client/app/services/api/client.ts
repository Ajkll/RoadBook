import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from '../firebase/auth';

// Get API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
