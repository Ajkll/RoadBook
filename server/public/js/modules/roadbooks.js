/**
 * Module RoadBook pour RoadBook Test
 * Gère les fonctionnalités de création, gestion, et visualisation des roadbooks
 */

// ======== FONCTIONS ROADBOOK ========

// Créer un nouveau roadbook
async function createRoadbook() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const title = document.getElementById('roadbook-title').value;
        const description = document.getElementById('roadbook-description').value;
        const targetHours = document.getElementById('roadbook-target-hours').value;
        
        if (!title) {
            alert('Titre requis');
            return;
        }
        
        const data = {
            title,
            description,
            targetHours: parseInt(targetHours) || 30
        };
        
        const result = await apiRequest('/roadbooks', 'POST', data);
        
        if (result.status === 'success') {
            alert('RoadBook créé avec succès!');
            getMyRoadbooks(); // Rafraîchir la liste
        }
    } catch (error) {
        console.error('Create roadbook error:', error);
    }
}

// Récupérer mes roadbooks
async function getMyRoadbooks() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const result = await apiRequest('/roadbooks', 'GET');
        
        if (result.status === 'success' && result.data) {
            renderRoadbookList(result.data);
        }
    } catch (error) {
        console.error('Get roadbooks error:', error);
    }
}

// Récupérer roadbooks où je suis guide
async function getGuidedRoadbooks() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const result = await apiRequest('/roadbooks/guided', 'GET');
        
        if (result.status === 'success' && result.data) {
            renderRoadbookList(result.data);
        }
    } catch (error) {
        console.error('Get guided roadbooks error:', error);
    }
}

// Afficher la liste des roadbooks
function renderRoadbookList(roadbooks) {
    const container = document.getElementById('roadbook-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!roadbooks || roadbooks.length === 0) {
        container.innerHTML = '<p>Aucun roadbook trouvé</p>';
        return;
    }
    
    let html = '';
    
    roadbooks.forEach(roadbook => {
        // Formater la date de création
        const createdDate = new Date(roadbook.createdAt).toLocaleDateString();
        
        // Définir la classe de statut
        let statusBadgeClass = 'badge-primary';
        if (roadbook.status === 'ACTIVE') statusBadgeClass = 'badge-success';
        else if (roadbook.status === 'COMPLETED') statusBadgeClass = 'badge-primary';
        else if (roadbook.status === 'ARCHIVED') statusBadgeClass = 'badge-danger';
        
        html += `
            <div class="list-item">
                <div class="list-item-title">
                    ${roadbook.title}
                    <span class="badge ${statusBadgeClass}">${roadbook.status}</span>
                </div>
                <p>${roadbook.description || 'Pas de description'}</p>
                <div style="margin-top: 5px;">
                    <span class="badge badge-primary">Heures cibles: ${roadbook.targetHours}h</span>
                    <span class="badge">Créé le: ${createdDate}</span>
                    ${roadbook._count ? `<span class="badge">Sessions: ${roadbook._count.sessions}</span>` : ''}
                </div>
                <div style="margin-top: 10px;">
                    <button class="btn btn-sm btn-primary" onclick="fillRoadbookId('${roadbook.id}')">Utiliser ID</button>
                    <button class="btn btn-sm btn-secondary" onclick="getRoadbookById('${roadbook.id}')">Détails</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `<div class="list-group">${html}</div>`;
}

// Récupérer un roadbook par ID
async function getRoadbookById(id) {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        // Utiliser l'ID passé en paramètre ou récupérer du champ
        const roadbookId = id || document.getElementById('roadbook-id').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        await apiRequest(`/roadbooks/${roadbookId}`, 'GET');
    } catch (error) {
        console.error('Get roadbook error:', error);
    }
}

// Récupérer les statistiques d'un roadbook
async function getRoadbookStatistics() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('roadbook-id').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        await apiRequest(`/roadbooks/${roadbookId}/statistics`, 'GET');
    } catch (error) {
        console.error('Get roadbook statistics error:', error);
    }
}

// Exporter un roadbook (JSON/PDF)
async function exportRoadbook() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('roadbook-id').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        await apiRequest(`/roadbooks/${roadbookId}/export?format=json`, 'GET');
    } catch (error) {
        console.error('Export roadbook error:', error);
    }
}

// Mettre à jour le statut d'un roadbook
async function updateRoadbookStatus() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('roadbook-id').value;
        const status = document.getElementById('roadbook-status').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/status`, 'PATCH', {
            status
        });
        
        if (result.status === 'success') {
            alert(`Statut du roadbook mis à jour: ${status}`);
            getMyRoadbooks(); // Rafraîchir la liste
        }
    } catch (error) {
        console.error('Update roadbook status error:', error);
    }
}

// Assigner un guide à un roadbook
async function assignGuide() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('roadbook-id').value;
        const guideId = document.getElementById('guide-id').value;
        
        if (!roadbookId || !guideId) {
            alert('ID du roadbook et ID du guide requis');
            return;
        }
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/guide`, 'POST', {
            guideId
        });
        
        if (result.status === 'success') {
            alert('Guide assigné avec succès!');
        }
    } catch (error) {
        console.error('Assign guide error:', error);
    }
}