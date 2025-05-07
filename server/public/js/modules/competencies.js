/**
 * Module de gestion des compétences pour RoadBook Test
 * Gère les fonctionnalités liées à la taxonomie des compétences,
 * la progression de l'apprentissage et la validation des acquis.
 */

// ======== FONCTIONS DE GESTION DES COMPÉTENCES ========

/**
 * Récupérer toutes les compétences disponibles
 */
async function getAllCompetencies() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        // Récupérer les filtres optionnels
        const phase = document.getElementById('competency-phase-filter')?.value;
        const category = document.getElementById('competency-category-filter')?.value;
        
        // Construire l'URL avec filtres
        let url = '/competencies';
        const params = [];
        if (phase) params.push(`phase=${phase}`);
        if (category) params.push(`category=${category}`);
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        const result = await apiRequest(url, 'GET');
        
        if (result.status === 'success') {
            showCompetenciesList(result.data);
        }
    } catch (error) {
        console.error('Error getting competencies:', error);
    }
}

/**
 * Récupérer les détails d'une compétence spécifique
 */
async function getCompetencyById() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const competencyId = document.getElementById('competency-id-input').value;
        
        if (!competencyId) {
            alert('ID de compétence requis');
            return;
        }
        
        const result = await apiRequest(`/competencies/${competencyId}`, 'GET');
        
        if (result.status === 'success') {
            showCompetencyDetails(result.data);
        }
    } catch (error) {
        console.error('Error getting competency:', error);
    }
}

/**
 * Récupérer la progression des compétences pour un roadbook
 */
async function getCompetencyProgressForRoadbook() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('roadbook-id-input').value;
        
        if (!roadbookId) {
            alert('ID du roadbook requis');
            return;
        }
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/competencies`, 'GET');
        
        if (result.status === 'success') {
            showCompetencyProgress(result.data);
        }
    } catch (error) {
        console.error('Error getting competency progress:', error);
    }
}

/**
 * Mettre à jour le statut d'une compétence pour un roadbook
 */
async function updateCompetencyStatus() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const roadbookId = document.getElementById('update-roadbook-id').value;
        const competencyId = document.getElementById('update-competency-id').value;
        const status = document.getElementById('update-status').value;
        const notes = document.getElementById('update-notes').value;
        
        if (!roadbookId || !competencyId || !status) {
            alert('Roadbook ID, compétence ID et statut sont requis');
            return;
        }
        
        const data = {
            status,
            notes: notes || null
        };
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/competencies/${competencyId}`, 'PUT', data);
        
        if (result.status === 'success') {
            alert('Statut de la compétence mis à jour avec succès');
            
            // Réinitialiser le formulaire
            document.getElementById('update-notes').value = '';
            
            // Rafraîchir la progression des compétences si affichée
            if (document.getElementById('roadbook-id-input').value === roadbookId) {
                getCompetencyProgressForRoadbook();
            }
        }
    } catch (error) {
        console.error('Error updating competency status:', error);
    }
}

/**
 * Valider des compétences dans une session
 */
async function validateCompetencies() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const sessionId = document.getElementById('validation-session-id').value;
        
        if (!sessionId) {
            alert('ID de session requis');
            return;
        }
        
        // Récupérer les compétences sélectionnées pour validation
        const competencyCheckboxes = document.querySelectorAll('input[name="validate-competency"]:checked');
        
        if (competencyCheckboxes.length === 0) {
            alert('Veuillez sélectionner au moins une compétence à valider');
            return;
        }
        
        // Construire l'array de validations
        const validations = Array.from(competencyCheckboxes).map(checkbox => {
            const competencyId = checkbox.value;
            const notesField = document.getElementById(`validation-notes-${competencyId}`);
            
            return {
                competencyId,
                validated: true,
                notes: notesField ? notesField.value : ''
            };
        });
        
        const result = await apiRequest(`/sessions/${sessionId}/competencies/validate`, 'POST', {
            validations
        });
        
        if (result.status === 'success') {
            alert(`${result.data.filter(r => r.success).length} compétences validées avec succès`);
            
            // Réinitialiser les checkboxes
            competencyCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
                const notesField = document.getElementById(`validation-notes-${checkbox.value}`);
                if (notesField) notesField.value = '';
            });
        }
    } catch (error) {
        console.error('Error validating competencies:', error);
    }
}

/**
 * Récupérer les statistiques de compétences d'un apprenti
 */
async function getApprenticeCompetencyStats() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const apprenticeId = document.getElementById('apprentice-id-input').value || 'me';
        
        const result = await apiRequest(`/users/${apprenticeId}/competencies/stats`, 'GET');
        
        if (result.status === 'success') {
            showCompetencyStats(result.data);
        }
    } catch (error) {
        console.error('Error getting competency stats:', error);
    }
}

// ======== FONCTIONS D'AFFICHAGE ========

/**
 * Afficher la liste des compétences
 */
function showCompetenciesList(competencies) {
    const container = document.getElementById('competencies-list-container');
    
    if (!container) return;
    
    container.style.display = 'block';
    
    if (!competencies || competencies.length === 0) {
        container.innerHTML = '<p>Aucune compétence trouvée</p>';
        return;
    }
    
    // Organiser les compétences par phase et catégorie
    const phaseMap = {};
    
    competencies.forEach(competency => {
        if (!phaseMap[competency.phase]) {
            phaseMap[competency.phase] = {};
        }
        
        if (!phaseMap[competency.phase][competency.category]) {
            phaseMap[competency.phase][competency.category] = [];
        }
        
        phaseMap[competency.phase][competency.category].push(competency);
    });
    
    // Créer l'affichage
    let html = '<div class="competencies-container">';
    
    // Pour chaque phase
    Object.keys(phaseMap).forEach(phase => {
        html += `
            <div class="phase-container">
                <h3 class="phase-title">${formatPhase(phase)}</h3>
                <div class="categories-container">
        `;
        
        // Pour chaque catégorie dans cette phase
        Object.keys(phaseMap[phase]).forEach(category => {
            html += `
                <div class="category-container">
                    <h4 class="category-title">${formatCategory(category)}</h4>
                    <ul class="competencies-list">
            `;
            
            // Pour chaque compétence dans cette catégorie
            phaseMap[phase][category].forEach(competency => {
                html += `
                    <li class="competency-item" data-id="${competency.id}">
                        <div class="competency-name">${competency.name}</div>
                        <div class="competency-description">${competency.description || ''}</div>
                        <button class="btn btn-sm btn-secondary" onclick="fillCompetencyId('${competency.id}')">Sélectionner</button>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Afficher les détails d'une compétence
 */
function showCompetencyDetails(competency) {
    const container = document.getElementById('competency-details-container');
    
    if (!container) return;
    
    container.style.display = 'block';
    
    let html = `
        <div class="card">
            <div class="card-header">
                <h3>${competency.name}</h3>
                <div class="competency-id"><small>ID: ${competency.id}</small></div>
            </div>
            <div class="card-body">
                <table class="details-table">
                    <tr>
                        <td><strong>Phase</strong></td>
                        <td>${formatPhase(competency.phase)}</td>
                    </tr>
                    <tr>
                        <td><strong>Catégorie</strong></td>
                        <td>${formatCategory(competency.category)}</td>
                    </tr>
                    <tr>
                        <td><strong>Ordre</strong></td>
                        <td>${competency.order}</td>
                    </tr>
                    <tr>
                        <td><strong>Code officiel</strong></td>
                        <td>${competency.officialCode || '-'}</td>
                    </tr>
                </table>
                
                <div class="description-section">
                    <h4>Description</h4>
                    <div class="description-content">${competency.description || 'Aucune description disponible'}</div>
                </div>
            </div>
            <div class="card-footer">
                <button onclick="fillUpdateForm('${competency.id}')" class="btn btn-primary btn-sm">Utiliser pour mise à jour</button>
                <button onclick="fillValidationForm('${competency.id}')" class="btn btn-success btn-sm">Utiliser pour validation</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Afficher la progression des compétences pour un roadbook
 */
function showCompetencyProgress(progressData) {
    const container = document.getElementById('competency-progress-container');
    
    if (!container) return;
    
    container.style.display = 'block';
    
    // Afficher les statistiques générales
    const stats = progressData.stats;
    
    let html = `
        <div class="progress-stats">
            <h3>Progression globale</h3>
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.percentage}%;">${stats.percentage}%</div>
                </div>
            </div>
            <div class="stats-details">
                <div class="stat-item">
                    <div class="stat-label">Maîtrisées</div>
                    <div class="stat-value">${stats.mastered}/${stats.total} (${stats.masteredPercentage}%)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">En progression</div>
                    <div class="stat-value">${stats.inProgress}/${stats.total} (${stats.inProgressPercentage}%)</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Non débutées</div>
                    <div class="stat-value">${stats.notStarted}/${stats.total} (${stats.notStartedPercentage}%)</div>
                </div>
            </div>
        </div>
    `;
    
    // Afficher les phases
    html += '<div class="phases-container">';
    
    progressData.phases.forEach(phase => {
        html += `
            <div class="phase-progress">
                <h3>${formatPhase(phase.name)} <span class="phase-progress-percentage">${phase.progress.percentage}%</span></h3>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${phase.progress.percentage}%;">${phase.progress.percentage}%</div>
                    </div>
                </div>
                
                <div class="categories-container">
        `;
        
        phase.categories.forEach(category => {
            html += `
                <div class="category-progress">
                    <h4>${formatCategory(category.name)} <span class="category-progress-percentage">${category.progress.percentage}%</span></h4>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${category.progress.percentage}%;">${category.progress.percentage}%</div>
                        </div>
                    </div>
                    
                    <table class="competencies-table">
                        <thead>
                            <tr>
                                <th>Compétence</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            category.competencies.forEach(competency => {
                const statusClass = getStatusClass(competency.status);
                const statusLabel = formatStatus(competency.status);
                
                html += `
                    <tr>
                        <td>${competency.competency.name}</td>
                        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                        <td>
                            <select id="status-select-${competency.competencyId}" class="status-select">
                                <option value="NOT_STARTED" ${competency.status === 'NOT_STARTED' ? 'selected' : ''}>Non débutée</option>
                                <option value="IN_PROGRESS" ${competency.status === 'IN_PROGRESS' ? 'selected' : ''}>En progression</option>
                                <option value="MASTERED" ${competency.status === 'MASTERED' ? 'selected' : ''}>Maîtrisée</option>
                            </select>
                            <button class="btn btn-sm btn-primary" onclick="updateCompetencyStatusInline('${progressData.roadbookId}', '${competency.competencyId}')">Mettre à jour</button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Afficher les statistiques de compétences d'un apprenti
 */
function showCompetencyStats(stats) {
    const container = document.getElementById('competency-stats-container');
    
    if (!container) return;
    
    container.style.display = 'block';
    
    let html = `
        <div class="card">
            <div class="card-header">
                <h3>Statistiques de compétences pour ${stats.apprentice.displayName}</h3>
            </div>
            <div class="card-body">
                <div class="overall-stats">
                    <h4>Progression globale</h4>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.overallProgressPercentage}%;">${stats.overallProgressPercentage}%</div>
                        </div>
                    </div>
                    <div class="stats-summary">
                        <div class="stat-item">
                            <div class="stat-label">Compétences maîtrisées</div>
                            <div class="stat-value">${stats.uniqueMasteredCompetencies}/${stats.totalCompetencies}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Roadbooks</div>
                            <div class="stat-value">${stats.totalRoadbooks}</div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-by-phase">
                    <h4>Progression par phase</h4>
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Phase</th>
                                <th>Progression</th>
                                <th>Maîtrisées</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    stats.phaseStats.forEach(phaseStat => {
        html += `
            <tr>
                <td>${formatPhase(phaseStat.phase)}</td>
                <td>
                    <div class="progress-bar-container small">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${phaseStat.progressPercentage}%;">${phaseStat.progressPercentage}%</div>
                        </div>
                    </div>
                </td>
                <td>${phaseStat.masteredCompetencies}</td>
                <td>${phaseStat.totalCompetencies}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="stats-by-category">
                    <h4>Progression par catégorie</h4>
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Catégorie</th>
                                <th>Progression</th>
                                <th>Maîtrisées</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    stats.categoryStats.forEach(categoryStat => {
        html += `
            <tr>
                <td>${formatCategory(categoryStat.category)}</td>
                <td>
                    <div class="progress-bar-container small">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${categoryStat.progressPercentage}%;">${categoryStat.progressPercentage}%</div>
                        </div>
                    </div>
                </td>
                <td>${categoryStat.masteredCompetencies}</td>
                <td>${categoryStat.totalCompetencies}</td>
            </tr>
        `;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="status-distribution">
                    <h4>Distribution des statuts</h4>
                    <div class="status-counts">
                        <div class="status-count-item mastered">
                            <div class="status-count-label">Maîtrisées</div>
                            <div class="status-count-value">${stats.statusCounts.MASTERED}</div>
                        </div>
                        <div class="status-count-item in-progress">
                            <div class="status-count-label">En progression</div>
                            <div class="status-count-value">${stats.statusCounts.IN_PROGRESS}</div>
                        </div>
                        <div class="status-count-item not-started">
                            <div class="status-count-label">Non débutées</div>
                            <div class="status-count-value">${stats.statusCounts.NOT_STARTED}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ======== FONCTIONS UTILITAIRES ========

/**
 * Mettre à jour le statut d'une compétence directement depuis le tableau de progression
 */
async function updateCompetencyStatusInline(roadbookId, competencyId) {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const statusSelect = document.getElementById(`status-select-${competencyId}`);
        if (!statusSelect) return;
        
        const status = statusSelect.value;
        
        const data = {
            status,
            notes: null
        };
        
        const result = await apiRequest(`/roadbooks/${roadbookId}/competencies/${competencyId}`, 'PUT', data);
        
        if (result.status === 'success') {
            // Mettre à jour l'affichage sans recharger toute la progression
            const row = statusSelect.closest('tr');
            const statusCell = row.querySelector('td:nth-child(2)');
            
            if (statusCell) {
                const statusClass = getStatusClass(status);
                const statusLabel = formatStatus(status);
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusLabel}</span>`;
            }
        }
    } catch (error) {
        console.error('Error updating competency status:', error);
    }
}

/**
 * Remplir l'ID de compétence dans les différents formulaires
 */
function fillCompetencyId(competencyId) {
    const idInputs = document.querySelectorAll('input[id$="-competency-id"]');
    idInputs.forEach(input => {
        input.value = competencyId;
    });
    
    document.getElementById('competency-id-input').value = competencyId;
}

/**
 * Remplir le formulaire de mise à jour de statut
 */
function fillUpdateForm(competencyId) {
    document.getElementById('update-competency-id').value = competencyId;
    
    // Faire défiler jusqu'au formulaire de mise à jour
    const form = document.getElementById('update-competency-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Remplir le formulaire de validation
 */
function fillValidationForm(competencyId) {
    // Cocher la case correspondante dans le formulaire de validation
    const checkbox = document.querySelector(`input[name="validate-competency"][value="${competencyId}"]`);
    if (checkbox) {
        checkbox.checked = true;
        
        // Faire défiler jusqu'au formulaire de validation
        const form = document.getElementById('validation-form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

/**
 * Formater le nom d'une phase
 */
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

/**
 * Formater le nom d'une catégorie
 */
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

/**
 * Formater le statut d'une compétence
 */
function formatStatus(status) {
    const statusMap = {
        'NOT_STARTED': 'Non débutée',
        'IN_PROGRESS': 'En progression',
        'MASTERED': 'Maîtrisée'
    };
    
    return statusMap[status] || status;
}

/**
 * Obtenir la classe CSS pour un statut
 */
function getStatusClass(status) {
    const classMap = {
        'NOT_STARTED': 'status-not-started',
        'IN_PROGRESS': 'status-in-progress',
        'MASTERED': 'status-mastered'
    };
    
    return classMap[status] || '';
}