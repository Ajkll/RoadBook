// client/app/services/api/utils.ts
import { AxiosResponse } from 'axios';

/**
 * Helper function to extract data from API responses
 * Handles both nested response format (production API) and direct format
 * 
 * Production API format: { status: "success", data: { ... } }
 * Direct format: data is directly in response.data
 * 
 * @param response The axios response object
 * @returns The actual data content from the response
 */
export function extractApiData<T>(response: AxiosResponse): T {
  // Check if the response has a nested data structure
  if (response.data && response.data.data !== undefined) {
    // Production API format: { status: "success", data: { ... } }
    return response.data.data as T;
  } else {
    // Direct format: the data is directly in response.data
    return response.data as T;
  }
}

/**
 * Same as extractApiData but for direct data objects (not AxiosResponse)
 * Useful when you already have the response.data object
 * 
 * @param data The data object from an API response
 * @returns The actual data content
 */
export function extractData<T>(data: any): T {
  if (data && data.data !== undefined) {
    return data.data as T;
  } else {
    return data as T;
  }
}

/**
 * Helper to check if an API response is in the nested format
 * 
 * @param data The data to check
 * @returns True if it's a nested API response with status and data properties
 */
export function isNestedApiResponse(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.status !== undefined &&
    data.data !== undefined
  );
}

/**
 * Helper to safely extract error messages from API responses
 * 
 * @param error The error object from a catch block
 * @returns A user-friendly error message
 */
export function extractErrorMessage(error: any): string {
  // Extract API error message if available
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // If it's a nested error response
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  // Use the error message property
  if (error.message) {
    return error.message;
  }
  
  // Default fallback message
  return 'Une erreur est survenue. Veuillez réessayer.';
}