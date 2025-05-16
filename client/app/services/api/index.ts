// client/app/services/api/index.ts
// Export central point for all API services

import authApi from './auth.api';
import apiClient from './client';
import userApi from './user.api';

export {
  authApi,
  apiClient,
  userApi
};