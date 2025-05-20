// client/app/services/api/utils.ts
import { AxiosResponse } from 'axios';
import { logger } from '../../utils/logger';

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

/**
 * Fonction utilitaire pour la gestion des endpoints absents
 * Permet d'exécuter une fonction API et de fournir des données de fallback 
 * en cas d'erreur 404 ou autre problème
 * 
 * @param apiCall Fonction à exécuter pour appeler l'API
 * @param fallbackData Données à utiliser en cas d'échec de l'API
 * @param endpointName Nom de l'endpoint pour le logging
 * @returns Résultat de l'API ou les données de fallback
 */
export async function withFallback<T>(
  apiCall: () => Promise<T>,
  fallbackData: T,
  endpointName: string
): Promise<T> {
  try {
    // Tentative d'appel de l'API
    return await apiCall();
  } catch (error) {
    // Vérifier si c'est une erreur 404 (endpoint non disponible)
    if (error.response?.status === 404) {
      logger.warn(`${endpointName} endpoint not available, using fallback data:`, error);
    } else {
      logger.error(`Error calling ${endpointName}:`, error);
    }
    
    // Retourner les données de fallback
    return fallbackData;
  }
}