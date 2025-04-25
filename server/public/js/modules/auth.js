/**
 * Module d'authentification pour RoadBook Test
 * Gère les fonctionnalités d'inscription, connexion et gestion des tokens
 */

// Initialiser le module d'authentification
function initAuth() {
    // Vérifier les tokens au démarrage
    updateTokenStatus();
    updateAuthStatusDisplay();
    
    // Auto-vérification du token si présent
    if (accessToken) {
        verifyToken(true);
    }
}

// ======== FONCTIONS D'AUTHENTIFICATION ========

// Inscription d'un nouvel utilisateur
async function register() {
    try {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const displayName = document.getElementById('register-display-name').value;
        const role = document.getElementById('register-role').value;
        
        if (!email || !password || !displayName) {
            alert('Tous les champs sont requis');
            return;
        }
        
        const result = await apiRequest('/auth/register', 'POST', {
            email,
            password,
            displayName,
            role
        });
        
        if (result.status === 'success') {
            // Stocker les tokens
            accessToken = result.accessToken;
            userRefreshToken = result.refreshToken;
            currentUser = result.user;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', userRefreshToken);
            
            updateTokenStatus();
            updateAuthStatusDisplay();
            
            alert('Inscription réussie!');
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}

// Connexion
async function login() {
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Email et mot de passe sont requis');
            return;
        }
        
        const result = await apiRequest('/auth/login', 'POST', {
            email,
            password
        });
        
        if (result.status === 'success') {
            // Stocker les tokens
            accessToken = result.accessToken;
            userRefreshToken = result.refreshToken;
            currentUser = result.user;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', userRefreshToken);
            
            updateTokenStatus();
            updateAuthStatusDisplay();
            
            alert('Connexion réussie!');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// Rafraîchir le token
async function refreshToken() {
    try {
        if (!userRefreshToken) {
            alert('Pas de refresh token disponible');
            return;
        }
        
        const result = await apiRequest('/auth/refresh-token', 'POST', {
            refreshToken: userRefreshToken
        });
        
        if (result.status === 'success') {
            // Mettre à jour l'access token (et le refresh token si présent)
            accessToken = result.accessToken;
            localStorage.setItem('accessToken', accessToken);
            
            if (result.refreshToken) {
                userRefreshToken = result.refreshToken;
                localStorage.setItem('refreshToken', userRefreshToken);
            }
            
            updateTokenStatus();
            
            alert('Token rafraîchi avec succès!');
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        clearAuthTokens();
    }
}

// Vérifier la validité du token
async function verifyToken(silent = false) {
    try {
        if (!accessToken) {
            if (!silent) alert('Pas d\'access token disponible');
            return false;
        }
        
        const result = await apiRequest('/auth/verify', 'GET', null, silent);
        
        if (result.status === 'success' && result.valid) {
            if (!silent) alert('Token valide!');
            
            // Mettre à jour currentUser si disponible
            if (result.user) {
                currentUser = result.user;
                updateAuthStatusDisplay();
            }
            
            return true;
        } else {
            if (!silent) alert('Token invalide ou expiré!');
            
            // Effacer le token invalide
            if (!result.valid) {
                clearAuthTokens();
            }
            
            return false;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        clearAuthTokens();
        return false;
    }
}

// Déconnexion
async function logout() {
    try {
        if (!userRefreshToken) {
            alert('Pas de refresh token disponible');
            clearAuthTokens();
            return;
        }
        
        const result = await apiRequest('/auth/logout', 'POST', {
            refreshToken: userRefreshToken
        });
        
        // Effacer les tokens quelle que soit la réponse
        clearAuthTokens();
        
        if (result.status === 'success') {
            alert('Déconnexion réussie!');
        }
    } catch (error) {
        console.error('Logout error:', error);
        clearAuthTokens();
    }
}

// Demande de réinitialisation de mot de passe
async function forgotPassword() {
    try {
        const email = document.getElementById('forgot-email').value;
        
        if (!email) {
            alert('Email requis');
            return;
        }
        
        const result = await apiRequest('/auth/forgot-password', 'POST', { email });
        
        if (result.status === 'success') {
            alert('Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        // Même en cas d'erreur, afficher un message neutre pour éviter les fuites d'information
        alert('Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.');
    }
}

// Réinitialisation de mot de passe
async function resetPassword() {
    try {
        const token = document.getElementById('reset-token').value;
        const newPassword = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        
        if (!token || !newPassword || !confirmPassword) {
            alert('Tous les champs sont requis');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }
        
        const result = await apiRequest('/auth/reset-password', 'POST', {
            token,
            newPassword,
            confirmPassword
        });
        
        if (result.status === 'success') {
            alert('Mot de passe réinitialisé avec succès!');
            // Effacer les champs après succès
            document.getElementById('reset-token').value = '';
            document.getElementById('reset-password').value = '';
            document.getElementById('reset-confirm-password').value = '';
        }
    } catch (error) {
        console.error('Reset password error:', error);
    }
}