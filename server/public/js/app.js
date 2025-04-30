/**
 * Application de test pour RoadBook API
 * Point d'entrée principal
 * 
 * Ce fichier initialise l'application et gère le routage entre les modules.
 */

// État global de l'application
const appState = {
    currentModule: 'welcome',
    isAuthenticated: false,
    selectedModuleElement: null
};

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 RoadBook Test App initializing...');
    
    // Initialiser la navigation entre modules
    initModuleNavigation();
    
    // Vérifier l'état d'authentification au démarrage
    if (typeof initAuth === 'function') {
        initAuth();
    } else {
        console.error('Module d\'authentification non chargé correctement');
    }
    
    // Initialiser l'interface utilisateur
    if (typeof initUI === 'function') {
        initUI();
    }
    
    console.log('✅ RoadBook Test App initialized successfully');
});

// Gérer la navigation entre modules
function initModuleNavigation() {
    // Ajouter les écouteurs d'événements aux boutons de module
    document.querySelectorAll('.module-button').forEach(button => {
        button.addEventListener('click', () => {
            const moduleId = button.getAttribute('data-module');
            if (moduleId) {
                showModule(moduleId);
            }
        });
    });
    
    // Activer le module initial (welcome)
    showModule('welcome');
}

// Fonction pour afficher un module spécifique
function showModule(moduleId) {
    // Vérifier si le module existe
    const moduleContainer = document.getElementById(`${moduleId}-module`);
    if (!moduleContainer) {
        console.error(`Module non trouvé: ${moduleId}`);
        return;
    }
    
    // Désactiver tous les modules et boutons
    document.querySelectorAll('.module-container').forEach(container => {
        container.classList.remove('active');
    });
    
    document.querySelectorAll('.module-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Activer le module et le bouton sélectionnés
    moduleContainer.classList.add('active');
    
    const moduleButton = document.querySelector(`.module-button[data-module="${moduleId}"]`);
    if (moduleButton) {
        moduleButton.classList.add('active');
    }
    
    // Mettre à jour l'état
    appState.currentModule = moduleId;
    appState.selectedModuleElement = moduleContainer;
    
    // Charger dynamiquement les données spécifiques au module si nécessaire
    if (moduleId === 'users' && typeof getCurrentUser === 'function') {
        // Essayer de charger les données utilisateur si connecté
        if (accessToken) {
            getCurrentUser(true);
        }
    }
    
    console.log(`📂 Module activé: ${moduleId}`);
}

// Fonction utilitaire pour charger dynamiquement un module
function loadModuleContent(moduleId, content) {
    const moduleContainer = document.getElementById(`${moduleId}-module`);
    if (moduleContainer) {
        moduleContainer.innerHTML = content;
    } else {
        console.error(`Container de module non trouvé: ${moduleId}`);
    }
}