/**
 * Gestionnaire d'interface utilisateur pour RoadBook Test
 * Fonctions génériques pour l'UI partagée entre les modules
 */

// Initialiser l'interface utilisateur
function initUI() {
    // Ajouter un écouteur pour les messages système
    window.addEventListener('message', handleSystemMessage);
    
    // Initialiser les tooltips et autres composants UI
    initUIComponents();
}

// Initialiser les composants d'interface
function initUIComponents() {
    // Cette fonction pourrait initialiser des composants UI avancés
    // si nous décidons d'ajouter des bibliothèques comme Bootstrap ou autres
}

// Afficher une notification à l'utilisateur
function showNotification(message, type = 'info') {
    // Types: info, success, warning, error
    const notificationArea = document.getElementById('notification-area') || createNotificationArea();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
    `;
    
    notificationArea.appendChild(notification);
    
    // Auto-effacement après 4 secondes
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Créer la zone de notification si elle n'existe pas
function createNotificationArea() {
    const notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.className = 'notification-area';
    document.body.appendChild(notificationArea);
    return notificationArea;
}

// Icônes pour les notifications
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        default: return 'ℹ️';
    }
}

// Traiter les messages système
function handleSystemMessage(event) {
    if (event.data && event.data.type === 'notification') {
        showNotification(event.data.message, event.data.notificationType);
    }
}

// Formater un objet JSON pour l'affichage
function formatJson(jsonObj) {
    return JSON.stringify(jsonObj, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}

// Afficher les résultats de la requête API
function displayApiResult(result, container) {
    const resultContainer = container || document.getElementById('response-output');
    if (!resultContainer) return;
    
    if (typeof result === 'object') {
        const formattedResult = formatJson(result);
        if (resultContainer.tagName === 'TEXTAREA') {
            resultContainer.value = JSON.stringify(result, null, 2);
        } else {
            resultContainer.innerHTML = `<pre class="json-result">${formattedResult}</pre>`;
        }
    } else {
        if (resultContainer.tagName === 'TEXTAREA') {
            resultContainer.value = result;
        } else {
            resultContainer.innerText = result;
        }
    }
}