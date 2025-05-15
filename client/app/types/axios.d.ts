// client/app/types/axios.d.ts
import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _isRetry?: boolean;
  }
}