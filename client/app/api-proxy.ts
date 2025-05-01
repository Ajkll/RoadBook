// client/app/api-proxy.ts
// Un module simple pour gérer la redirection des requêtes API
// Compatible avec React Native

import { Platform } from 'react-native';
import { Alert } from 'react-native';
// Import centralized API configuration from client.ts
import { API_URL, TUNNEL_MODE, CODESPACE_BASE_URL } from './services/api/client';

console.log('🔄 API PROXY: Using centralized configuration:');
console.log('🔄 API URL:', API_URL);
console.log('🔄 Tunnel Mode:', TUNNEL_MODE ? 'ENABLED' : 'DISABLED');

// Classe de configuration du proxy pour rediriger les requêtes API
// Maintenant utilisant la configuration centralisée de client.ts
class ApiProxy {
  private static instance: ApiProxy;
  private _baseUrl: string = API_URL;  // Use centralized API URL
  private _tunnelMode: boolean = TUNNEL_MODE;  // Use centralized tunnel mode detection

  private constructor() {
    console.log('📡 ApiProxy initialized with centralized configuration');
    console.log('📡 Base URL:', this._baseUrl);
    console.log('📡 Tunnel Mode:', this._tunnelMode ? 'ENABLED' : 'DISABLED');
  }

  public static getInstance(): ApiProxy {
    if (!ApiProxy.instance) {
      ApiProxy.instance = new ApiProxy();
    }
    return ApiProxy.instance;
  }

  // Obtenir l'URL de base pour les requêtes API (centralisée depuis client.ts)
  public getBaseUrl(): string {
    return this._baseUrl;
  }

  // Obtenir l'URL complète pour un chemin d'API spécifique
  public getUrl(path: string): string {
    // S'assurer que le chemin commence par "/" s'il n'est pas vide
    const formattedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${this._baseUrl}${formattedPath}`;
  }
  
  // Indiquer si l'application est en mode tunnel (centralisée depuis client.ts)
  public isTunnelMode(): boolean {
    return this._tunnelMode;
  }
  
  // Obtenir l'URL Codespace (centralisée depuis client.ts)
  public getCodespaceUrl(): string {
    return CODESPACE_BASE_URL;
  }
}

// Exporter une instance unique du proxy
export const apiProxy = ApiProxy.getInstance();

// Pour les tests, exporter une fonction qui vérifie la connexion
// Utilisant la configuration centralisée
export const testApiConnection = async () => {
  try {
    console.log('🔍 PROXY: Testing API connection to:', API_URL);
    console.log('🔍 PROXY: Tunnel mode:', TUNNEL_MODE ? 'ENABLED' : 'DISABLED');
    
    // Add timeout and more detailed logging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Tunnel-Mode': TUNNEL_MODE ? 'true' : 'false'
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ PROXY: API connection successful:', response.status, data);
      return {
        success: true,
        status: response.status,
        data,
        apiUrl: API_URL,
        tunnelMode: TUNNEL_MODE
      };
    } else {
      console.error('❌ PROXY: API connection failed with status:', response.status);
      let errorText = `Server responded with ${response.status}`;
      try {
        const errorData = await response.json();
        errorText += ` - ${JSON.stringify(errorData)}`;
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      return {
        success: false,
        status: response.status,
        error: errorText,
        apiUrl: API_URL,
        tunnelMode: TUNNEL_MODE
      };
    }
  } catch (error) {
    console.error('❌ PROXY: API connection failed with error:', error.message, error);
    
    // Better error information
    let errorDetails = error.message;
    if (error.name === 'AbortError') {
      errorDetails = 'Connection timed out after 10 seconds';
    } else if (error.message.includes('certificate')) {
      errorDetails = 'SSL Certificate error. The server\'s certificate may not be trusted.';
    }
    
    return {
      success: false,
      error: errorDetails,
      apiUrl: API_URL,
      tunnelMode: TUNNEL_MODE
    };
  }
};

export default apiProxy;