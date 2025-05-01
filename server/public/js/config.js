/**
 * Configuration globale pour l'application de test RoadBook
 */

// URL de base de l'API
const API_URL = '/api';

// Liste des modules disponibles
const MODULES = [
    {
        id: 'welcome',
        name: 'Accueil',
        icon: '🏠',
        description: 'Page d\'accueil et informations générales'
    },
    {
        id: 'auth',
        name: 'Authentification',
        icon: '🔐',
        description: 'Inscription, connexion et gestion des tokens'
    },
    {
        id: 'users',
        name: 'Utilisateurs',
        icon: '👤',
        description: 'Gestion des profils utilisateurs'
    },
    {
        id: 'roadbooks',
        name: 'RoadBooks',
        icon: '📔',
        description: 'Gestion des carnets d\'apprentissage'
    },
    {
        id: 'sessions',
        name: 'Sessions',
        icon: '🚗',
        description: 'Enregistrement des sessions de conduite'
    },
    {
        id: 'competencies',
        name: 'Compétences',
        icon: '📊',
        description: 'Suivi et validation des compétences',
        disabled: false
    },
    {
        id: 'community',
        name: 'Communauté',
        icon: '👥',
        description: 'Forums et discussions',
        disabled: false
    },
    {
        id: 'badges',
        name: 'Badges',
        icon: '🏆',
        description: 'Système de gamification',
        disabled: true
    },
    {
        id: 'marketplace',
        name: 'Marketplace',
        icon: '🛒',
        description: 'Échange de services et produits',
        disabled: false,
        externalUrl: '/marketplace-test.html'
    },
    {
        id: 'notifications',
        name: 'Notifications',
        icon: '🔔',
        description: 'Système d\'alertes et messages',
        disabled: false
    },
    {
        id: 'debug',
        name: 'API Debug',
        icon: '🔍',
        description: 'Outils de debug et inspection des réponses'
    }
];

// Comptes de test prédéfinis
const TEST_ACCOUNTS = [
    {
        email: 'apprentice@roadbook.com',
        password: 'Password123!',
        role: 'APPRENTICE'
    },
    {
        email: 'guide@roadbook.com',
        password: 'Password123!',
        role: 'GUIDE'
    },
    {
        email: 'instructor@roadbook.com',
        password: 'Password123!',
        role: 'INSTRUCTOR'
    },
    {
        email: 'admin@roadbook.com',
        password: 'Password123!',
        role: 'ADMIN'
    }
];

// Chargement des modules dynamiquement
function loadModules() {
    const moduleNav = document.getElementById('module-nav');
    if (moduleNav) {
        // Vider la navigation
        moduleNav.innerHTML = '';
        
        // Créer les boutons pour chaque module
        MODULES.forEach(module => {
            const button = document.createElement('button');
            button.className = `module-button ${module.id === 'welcome' ? 'active' : ''}`;
            
            if (module.externalUrl) {
                // Bouton avec URL externe
                button.addEventListener('click', () => {
                    window.location.href = module.externalUrl;
                });
            } else {
                // Bouton pour module interne
                button.setAttribute('data-module', module.id);
            }
            
            if (module.disabled) {
                button.className += ' disabled';
                button.setAttribute('disabled', 'disabled');
                button.setAttribute('title', 'Module à venir');
            }
            
            button.innerHTML = `
                <span class="icon">${module.icon}</span>
                ${module.name}
            `;
            
            moduleNav.appendChild(button);
        });
    }
}

// Fonctions utilitaires globales
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function fillCompetencyId(competencyId) {
    const compIdInputs = document.querySelectorAll('input[id*="competency-id"]');
    compIdInputs.forEach(input => {
        input.value = competencyId;
    });
}

function formatPhase(phase) {
    const phaseMap = {
        'PHASE1': 'Phase 1 - Bases et contrôle du véhicule',
        'PHASE2': 'Phase 2 - Environnement routier simple',
        'PHASE3': 'Phase 3 - Situations complexes',
        'PHASE4': 'Phase 4 - Conditions spéciales',
        'PHASE5': 'Phase 5 - Autonomie'
    };
    
    return phaseMap[phase] || phase;
}

function formatCategory(category) {
    const categoryMap = {
        'CONTROL': 'Contrôle du véhicule',
        'MANEUVERING': 'Manœuvres',
        'TRAFFIC_RULES': 'Règles de circulation',
        'RISK_PERCEPTION': 'Perception des risques',
        'ECOFRIENDLY_DRIVING': 'Conduite écologique',
        'SPECIAL_CONDITIONS': 'Conditions spéciales',
        'SAFETY': 'Sécurité'
    };
    
    return categoryMap[category] || category;
}

function formatStatus(status) {
    const statusMap = {
        'NOT_STARTED': 'Non débutée',
        'IN_PROGRESS': 'En progression',
        'MASTERED': 'Maîtrisée'
    };
    
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'NOT_STARTED': 'status-not-started',
        'IN_PROGRESS': 'status-in-progress',
        'MASTERED': 'status-mastered'
    };
    
    return classMap[status] || '';
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadModules();
});