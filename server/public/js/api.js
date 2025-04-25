/**
 * API Client pour RoadBook
 * Gère les appels API et le traitement des résultats
 */

// Variables d'état
let accessToken = localStorage.getItem('accessToken') || null;
let userRefreshToken = localStorage.getItem('refreshToken') || null;
let currentUser = null;

// ======== GESTION DES TOKENS ========

// Mettre à jour l'affichage des status de token
function updateTokenStatus() {
    const accessTokenStatus = document.getElementById('access-token-status');
    const refreshTokenStatus = document.getElementById('refresh-token-status');
    
    if (accessTokenStatus && refreshTokenStatus) {
        accessTokenStatus.innerText = accessToken ? 'Présent' : 'Non présent';
        refreshTokenStatus.innerText = userRefreshToken ? 'Présent' : 'Non présent';
        
        accessTokenStatus.className = accessToken ? 'text-success' : 'text-danger';
        refreshTokenStatus.className = userRefreshToken ? 'text-success' : 'text-danger';
    }
}

// Mettre à jour l'affichage du statut d'authentification
function updateAuthStatusDisplay() {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('auth-status-text');
    
    if (statusIndicator && statusText) {
        if (accessToken) {
            statusText.innerText = currentUser ? 
                `Connecté (${currentUser.displayName || currentUser.email})` : 
                'Connecté';
            statusIndicator.className = 'status-indicator status-connected';
        } else {
            statusText.innerText = 'Non connecté';
            statusIndicator.className = 'status-indicator status-disconnected';
        }
    }
}

// ======== GESTION DES RÉPONSES API ========

// Afficher la réponse dans la zone de sortie
function showResponse(response) {
    const output = document.getElementById('response-output');
    if (output) {
        if (typeof response === 'object') {
            output.value = JSON.stringify(response, null, 2);
        } else {
            output.value = response;
        }
    }
}

// Gérer les erreurs API
function handleApiError(error) {
    console.error('API Error:', error);
    showResponse({
        status: 'error',
        message: error.message || 'Une erreur est survenue',
        details: error.toString()
    });
    
    // Si l'erreur est liée à l'authentification, nettoyer les tokens
    if (error.message && (
        error.message.includes('token') || 
        error.message.includes('Token') || 
        error.message.includes('auth') || 
        error.message.includes('Auth')
    )) {
        clearAuthTokens();
    }
}

// Utilitaire pour afficher les détails de la requête
function logRequest(endpoint, method, data) {
    console.log(`API Request: ${method} ${API_URL}${endpoint}`);
    if (data) console.log('Request Data:', data);
    
    // Afficher la requête pour le débogage
    showResponse({
        debug: true,
        timestamp: new Date().toISOString(),
        endpoint: `${API_URL}${endpoint}`,
        method,
        data,
        headers: accessToken ? {'Authorization': `Bearer ${accessToken}`} : {}
    });
}

// ======== REQUÊTES API ========

// Effectuer une requête API avec authentification
async function apiRequest(endpoint, method = 'GET', data = null, silent = false) {
    try {
        // Journaliser la requête si non silencieuse
        if (!silent) {
            logRequest(endpoint, method, data);
        }
        
        // Configurer les en-têtes
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Options de la requête
        const fetchOptions = {
            method,
            headers,
            credentials: 'include'
        };
        
        // Ajouter le corps de la requête pour les méthodes non-GET
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(data);
        }
        
        // Effectuer la requête
        const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
        
        // Traiter la réponse
        try {
            const responseData = await response.json();
            
            // Afficher la réponse si la requête n'est pas silencieuse
            if (!silent) {
                console.log('Response:', responseData);
                showResponse(responseData);
            }
            
            // Gérer les erreurs HTTP
            if (!response.ok) {
                const error = new Error(responseData.message || `HTTP error ${response.status}`);
                error.statusCode = response.status;
                error.response = responseData;
                throw error;
            }
            
            return responseData;
        } catch (jsonError) {
            // Erreur de parsing JSON
            console.error('Error parsing JSON response:', jsonError);
            const errorData = {
                status: 'error',
                message: 'Error parsing server response',
                httpStatus: response.status,
                text: await response.text()
            };
            
            if (!silent) {
                showResponse(errorData);
            }
            
            throw new Error(`Failed to parse JSON: ${errorData.text.substring(0, 100)}...`);
        }
    } catch (error) {
        // Ne pas afficher l'erreur pour les requêtes silencieuses
        if (!silent) {
            handleApiError(error);
        }
        throw error;
    }
}

// Nettoyer les tokens d'authentification
function clearAuthTokens() {
    accessToken = null;
    userRefreshToken = null;
    currentUser = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    updateTokenStatus();
    updateAuthStatusDisplay();
}