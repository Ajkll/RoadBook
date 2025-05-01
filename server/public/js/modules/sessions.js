/**
 * Module Sessions pour RoadBook Test
 * Gère les fonctionnalités de création, validation et suivi des sessions de conduite
 */

// ======== FONCTIONS DE GESTION DES SESSIONS ========

/**
 * Récupérer une session par son ID
 */
async function getSessionById() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('session-id-input').value;
        
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        const result = await apiRequest(`/sessions/${sessionId}`, 'GET');
        
        if (result.status === 'success') {
            showSessionDetails(result.data);
        }
    } catch (error) {
        console.error('Error fetching session:', error);
    }
}

/**
 * Récupérer les sessions d'un roadbook
 */
async function getRoadbookSessions() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('sessions-roadbook-id').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/sessions`, 'GET');
        
        if (result.status === 'success') {
            renderSessionsList(result.data);
            
            // Mettre à jour l'ID pour les autres formulaires
            document.getElementById('session-roadbook-id').value = roadbookId;
        }
    } catch (error) {
        console.error('Get sessions error:', error);
    }
}

/**
 * Créer une nouvelle session
 */
async function createSession() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('session-roadbook-id').value;
        const date = document.getElementById('session-date').value;
        const startTime = document.getElementById('session-start-time').value;
        const endTime = document.getElementById('session-end-time').value;
        const duration = document.getElementById('session-duration').value;
        const startLocation = document.getElementById('session-start-location').value;
        const endLocation = document.getElementById('session-end-location').value;
        const distance = document.getElementById('session-distance').value;
        const weather = document.getElementById('session-weather').value;
        const daylight = document.getElementById('session-daylight').value;
        const notes = document.getElementById('session-notes').value;
        
        if (!roadbookId || !date || !startTime) {
            alert('Roadbook ID, date et heure de début sont requis');
            return;
        }
        
        // Construire les dates complètes
        const datePart = new Date(date).toISOString().split('T')[0];
        
        const startDateTime = `${datePart}T${startTime}:00`;
        const endDateTime = endTime ? `${datePart}T${endTime}:00` : null;
        
        // Construire l'objet roadTypes à partir des checkboxes
        const roadTypeCheckboxes = document.querySelectorAll('input[name="roadType"]:checked');
        const roadTypes = Array.from(roadTypeCheckboxes).map(checkbox => checkbox.value);
        
        const data = {
            roadbookId,
            date: new Date(date).toISOString(),
            startTime: new Date(startDateTime).toISOString(),
            endTime: endDateTime ? new Date(endDateTime).toISOString() : null,
            duration: duration ? parseInt(duration) : null,
            startLocation,
            endLocation,
            distance: distance ? parseFloat(distance) : null,
            weather,
            daylight,
            roadTypes,
            notes
            // La route définira l'apprentice comme l'utilisateur actuel
        };
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/sessions`, 'POST', data);
        
        if (result.status === 'success') {
            alert('Session créée avec succès!');
            
            // Afficher les détails de la session créée
            showSessionDetails(result.data);
            
            // Mettre à jour la liste des sessions si on est sur la même page
            if (document.getElementById('sessions-roadbook-id').value === roadbookId) {
                getRoadbookSessions();
            }
            
            // Réinitialiser le formulaire
            document.getElementById('create-session-form').reset();
        }
    } catch (error) {
        console.error('Create session error:', error);
    }
}

/**
 * Valider une session (pour guides et instructeurs)
 */
async function validateSession() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('validate-session-id').value;
        const validationNotes = document.getElementById('validation-notes').value;
        
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        const result = await apiRequest(`/sessions/${sessionId}/validate`, 'POST', {
            notes: validationNotes
        });
        
        if (result.status === 'success') {
            alert('Session validée avec succès!');
            showSessionDetails(result.data);
            
            // Réinitialiser le formulaire
            document.getElementById('validation-notes').value = '';
        }
    } catch (error) {
        console.error('Error validating session:', error);
    }
}

/**
 * Mettre à jour une session
 */
async function updateSession() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('update-session-id').value;
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        // Récupérer les valeurs à mettre à jour
        const updateData = {};
        
        const notes = document.getElementById('update-session-notes').value;
        if (notes) updateData.notes = notes;
        
        const distance = document.getElementById('update-session-distance').value;
        if (distance) updateData.distance = parseFloat(distance);
        
        const duration = document.getElementById('update-session-duration').value;
        if (duration) updateData.duration = parseInt(duration);
        
        const endTime = document.getElementById('update-session-end-time').value;
        if (endTime) {
            // Format the end time
            const now = new Date();
            const datePart = now.toISOString().split('T')[0];
            const endDateTime = `${datePart}T${endTime}:00`;
            updateData.endTime = new Date(endDateTime).toISOString();
        }
        
        if (Object.keys(updateData).length === 0) {
            alert('Aucune donnée à mettre à jour');
            return;
        }
        
        const result = await apiRequest(`/sessions/${sessionId}`, 'PUT', updateData);
        
        if (result.status === 'success') {
            alert('Session mise à jour avec succès!');
            showSessionDetails(result.data);
            
            // Réinitialiser le formulaire
            document.getElementById('update-session-form').reset();
        }
    } catch (error) {
        console.error('Error updating session:', error);
    }
}

/**
 * Ajouter un commentaire à une session
 */
async function addSessionComment() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('comment-session-id').value;
        const content = document.getElementById('comment-content').value;
        
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        if (!content || content.trim() === '') {
            alert('Contenu du commentaire requis');
            return;
        }
        
        const result = await apiRequest(`/sessions/${sessionId}/comments`, 'POST', {
            content
        });
        
        if (result.status === 'success') {
            alert('Commentaire ajouté avec succès!');
            
            // Réinitialiser le formulaire
            document.getElementById('comment-content').value = '';
            
            // Rafraîchir les détails de la session pour voir le nouveau commentaire
            const sessionResult = await apiRequest(`/sessions/${sessionId}`, 'GET');
            if (sessionResult.status === 'success') {
                showSessionDetails(sessionResult.data);
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

/**
 * Supprimer une session
 */
async function deleteSession() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('delete-session-id').value;
        
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette session? Cette action est irréversible.')) {
            return;
        }
        
        const result = await apiRequest(`/sessions/${sessionId}`, 'DELETE');
        
        if (result.status === 'success') {
            alert('Session supprimée avec succès!');
            
            // Réinitialiser le formulaire et la zone d'affichage
            document.getElementById('delete-session-id').value = '';
            document.getElementById('session-details').innerHTML = '';
            document.getElementById('session-details-container').style.display = 'none';
            
            // Rafraîchir la liste des sessions si elle est affichée
            const roadbookId = document.getElementById('sessions-roadbook-id').value;
            if (roadbookId) {
                getRoadbookSessions();
            }
        }
    } catch (error) {
        console.error('Error deleting session:', error);
    }
}

/**
 * Récupérer les sessions d'un utilisateur
 */
async function getUserSessions() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const userId = document.getElementById('user-sessions-id').value || 'me';
        
        const result = await apiRequest(`/users/${userId}/sessions`, 'GET');
        
        if (result.status === 'success') {
            showUserSessions(result.data, result.pagination);
        }
    } catch (error) {
        console.error('Error getting user sessions:', error);
    }
}

// ======== FONCTIONS D'AFFICHAGE ========

/**
 * Afficher la liste des sessions d'un roadbook
 */
function renderSessionsList(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p>Aucune session trouvée</p>';
        return;
    }
    
    let html = '';
    
    sessions.forEach(session => {
        // Formater la date
        const sessionDate = new Date(session.date).toLocaleDateString();
        
        // Formater l'heure de début/fin
        const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        
        // Formater la durée
        const duration = session.duration ? `${Math.floor(session.duration / 60)}h${(session.duration % 60).toString().padStart(2, '0')}` : 'N/A';
        
        html += `
            <div class="list-item">
                <div class="list-item-title">
                    Session du ${sessionDate}
                    ${session.validatorId ? '<span class="badge badge-success">Validée</span>' : ''}
                </div>
                <div>
                    <span class="badge badge-primary">Début: ${startTime}</span>
                    <span class="badge">${endTime !== 'N/A' ? `Fin: ${endTime}` : ''}</span>
                    <span class="badge">${duration !== 'N/A' ? `Durée: ${duration}` : ''}</span>
                    ${session.distance ? `<span class="badge">Distance: ${session.distance}km</span>` : ''}
                </div>
                <div style="margin-top: 5px;">
                    ${session.weather ? `<span class="badge">Météo: ${formatWeather(session.weather)}</span>` : ''}
                    ${session.daylight ? `<span class="badge">Luminosité: ${formatDaylight(session.daylight)}</span>` : ''}
                </div>
                ${session.notes ? `<p style="margin-top: 10px;"><small>Notes:</small> ${session.notes}</p>` : ''}
                <div style="margin-top: 10px;">
                    <button class="btn btn-sm btn-secondary" onclick="fillSessionId('${session.id}')">Détails</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `<div class="list-group">${html}</div>`;
}

/**
 * Afficher les détails d'une session
 */
function showSessionDetails(session) {
    const container = document.getElementById('session-details-container');
    const detailsElement = document.getElementById('session-details');
    
    if (!container || !detailsElement) return;
    
    container.style.display = 'block';
    
    // Formater les dates
    const dateFormatted = new Date(session.date).toLocaleDateString('fr-BE');
    const startTimeFormatted = new Date(session.startTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
    const endTimeFormatted = session.endTime ? new Date(session.endTime).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) : '-';
    
    // Créer une carte pour la session
    let html = `
        <div class="card">
            <div class="card-header">
                <h3>Session du ${dateFormatted}</h3>
                <div class="session-id"><small>ID: ${session.id}</small></div>
            </div>
            <div class="card-body">
                <table class="details-table">
                    <tr>
                        <td><strong>Roadbook</strong></td>
                        <td>${session.roadbook?.title || '-'} (${session.roadbookId})</td>
                    </tr>
                    <tr>
                        <td><strong>Apprenti</strong></td>
                        <td>${session.apprentice?.displayName || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Date</strong></td>
                        <td>${dateFormatted}</td>
                    </tr>
                    <tr>
                        <td><strong>Heure de début</strong></td>
                        <td>${startTimeFormatted}</td>
                    </tr>
                    <tr>
                        <td><strong>Heure de fin</strong></td>
                        <td>${endTimeFormatted}</td>
                    </tr>
                    <tr>
                        <td><strong>Durée</strong></td>
                        <td>${session.duration ? formatDuration(session.duration) : '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Départ</strong></td>
                        <td>${session.startLocation || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Arrivée</strong></td>
                        <td>${session.endLocation || '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Distance</strong></td>
                        <td>${session.distance ? `${session.distance} km` : '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Météo</strong></td>
                        <td>${formatWeather(session.weather)}</td>
                    </tr>
                    <tr>
                        <td><strong>Luminosité</strong></td>
                        <td>${formatDaylight(session.daylight)}</td>
                    </tr>
                    <tr>
                        <td><strong>Types de route</strong></td>
                        <td>${session.roadTypes?.join(', ') || '-'}</td>
                    </tr>
                </table>
                
                <div class="validation-info">
                    <h4>Validation</h4>
                    ${session.validator 
                        ? `<div class="validated">
                             <div class="validator">Validé par ${session.validator.displayName}</div>
                             <div class="validation-date">le ${new Date(session.validationDate).toLocaleString('fr-BE')}</div>
                           </div>`
                        : '<div class="not-validated">Non validé</div>'
                    }
                </div>
                
                <div class="notes-section">
                    <h4>Notes</h4>
                    <div class="notes-content">${session.notes || 'Aucune note'}</div>
                </div>
                
                ${session.statistics ? `
                <div class="statistics">
                    <h4>Statistiques</h4>
                    <div>Vitesse moyenne: ${session.statistics.averageSpeed ? `${session.statistics.averageSpeed} km/h` : 'N/A'}</div>
                </div>` : ''}
                
                ${session.comments && session.comments.length > 0 ? `
                <div class="comments-section">
                    <h4>Commentaires (${session.comments.length})</h4>
                    <div class="comments-list">
                        ${session.comments.map(comment => `
                            <div class="comment">
                                <div class="comment-author">${comment.author.displayName}</div>
                                <div class="comment-date">${new Date(comment.createdAt).toLocaleString('fr-BE')}</div>
                                <div class="comment-content">${comment.content}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''
                }
            </div>
            <div class="card-footer">
                <div class="action-buttons">
                    <button onclick="fillSessionId('${session.id}')" class="btn btn-secondary btn-sm">Utiliser ID</button>
                    <button onclick="fillUpdateForm('${session.id}')" class="btn btn-primary btn-sm">Mettre à jour</button>
                    <button onclick="fillCommentForm('${session.id}')" class="btn btn-info btn-sm">Commenter</button>
                    ${!session.validator ? `<button onclick="fillValidationForm('${session.id}')" class="btn btn-success btn-sm">Valider</button>` : ''}
                    <button onclick="fillDeleteForm('${session.id}')" class="btn btn-danger btn-sm">Supprimer</button>
                </div>
            </div>
        </div>
    `;
    
    detailsElement.innerHTML = html;
}

/**
 * Afficher la liste des sessions d'un utilisateur
 */
function showUserSessions(sessions, pagination) {
    const container = document.getElementById('user-sessions-container');
    
    if (!container) return;
    
    container.style.display = 'block';
    
    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p>Aucune session trouvée</p>';
        return;
    }
    
    let html = `
        <h3>Sessions (${pagination?.total || sessions.length})</h3>
        <div class="sessions-list">
    `;
    
    sessions.forEach(session => {
        const dateFormatted = new Date(session.date).toLocaleDateString('fr-BE');
        const durationFormatted = session.duration ? formatDuration(session.duration) : '-';
        
        html += `
            <div class="session-item">
                <div class="session-header">
                    <div class="session-title">Session du ${dateFormatted}</div>
                    <div class="session-status">${session.validator ? 'Validé' : 'Non validé'}</div>
                </div>
                <div class="session-details">
                    <div>Durée: ${durationFormatted}</div>
                    <div>Distance: ${session.distance ? `${session.distance} km` : '-'}</div>
                    <div>Roadbook: ${session.roadbook?.title || '-'}</div>
                </div>
                <div class="session-actions">
                    <button onclick="fillSessionId('${session.id}')" class="btn btn-primary btn-sm">Détails</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Ajouter pagination si nécessaire
    if (pagination && pagination.pages > 1) {
        html += `
            <div class="pagination">
                <span>Page ${pagination.currentPage} sur ${pagination.pages}</span>
                <!-- Ajouter boutons pagination ici si nécessaire -->
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ======== FONCTIONS UTILITAIRES ========

/**
 * Formatage de la durée en heures/minutes
 */
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    } else {
        return `${mins}min`;
    }
}

/**
 * Formatage des conditions météo
 */
function formatWeather(weather) {
    const weatherMap = {
        'CLEAR': 'Dégagé',
        'CLOUDY': 'Nuageux',
        'RAINY': 'Pluvieux',
        'SNOWY': 'Neigeux',
        'FOGGY': 'Brumeux',
        'WINDY': 'Venteux',
        'OTHER': 'Autre'
    };
    
    return weatherMap[weather] || weather || '-';
}

/**
 * Formatage des conditions de luminosité
 */
function formatDaylight(daylight) {
    const daylightMap = {
        'DAY': 'Jour',
        'NIGHT': 'Nuit',
        'DAWN_DUSK': 'Aube/Crépuscule'
    };
    
    return daylightMap[daylight] || daylight || '-';
}

/**
 * Remplir l'ID de session dans les différents formulaires
 */
function fillSessionId(sessionId) {
    const idInputs = document.querySelectorAll('input[id$="-session-id"]');
    idInputs.forEach(input => {
        input.value = sessionId;
    });
    
    document.getElementById('session-id-input').value = sessionId;
}

/**
 * Remplir le formulaire de validation
 */
function fillValidationForm(sessionId) {
    document.getElementById('validate-session-id').value = sessionId;
    
    // Faire défiler jusqu'au formulaire de validation
    const form = document.getElementById('session-validation-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Remplir le formulaire de commentaire
 */
function fillCommentForm(sessionId) {
    document.getElementById('comment-session-id').value = sessionId;
    
    // Faire défiler jusqu'au formulaire de commentaire
    const form = document.getElementById('comment-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Remplir le formulaire de mise à jour
 */
function fillUpdateForm(sessionId) {
    document.getElementById('update-session-id').value = sessionId;
    
    // Faire défiler jusqu'au formulaire de mise à jour
    const form = document.getElementById('update-session-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Remplir le formulaire de suppression
 */
function fillDeleteForm(sessionId) {
    document.getElementById('delete-session-id').value = sessionId;
    
    // Faire défiler jusqu'au formulaire de suppression
    const form = document.getElementById('delete-session-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}