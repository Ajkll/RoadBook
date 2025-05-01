/**
 * Module de gestion des utilisateurs pour RoadBook Test
 * Gère les fonctionnalités de profil, mise à jour, et recherche d'utilisateurs
 */

// ======== FONCTIONS UTILISATEUR ========

// Récupérer le profil de l'utilisateur courant
async function getCurrentUser() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const result = await apiRequest('/users/me', 'GET');
        
        if (result.status === 'success') {
            currentUser = result.data;
            updateAuthStatusDisplay();
            
            // Afficher les détails du profil
            const profileContainer = document.getElementById('current-user-profile');
            const profileDetails = document.getElementById('profile-details');
            
            if (profileContainer && profileDetails) {
                profileContainer.style.display = 'block';
                
                // Formater les dates
                const createdAt = new Date(currentUser.createdAt).toLocaleString();
                const updatedAt = new Date(currentUser.updatedAt).toLocaleString();
                const profilePictureLastUpdated = currentUser.profilePictureLastUpdated ? 
                    new Date(currentUser.profilePictureLastUpdated).toLocaleString() : '-';
                
                let profileHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">ID</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Email</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Nom d'affichage</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.displayName || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Prénom</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.firstName || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Nom</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.lastName || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Rôle</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.role}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Bio</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.bio || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Photo de profil</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.profilePicture ? 'Présente' : 'Non définie'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Type de photo</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${currentUser.profilePictureType || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Photo mise à jour le</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${profilePictureLastUpdated}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Créé le</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${createdAt}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight: bold;">Mis à jour le</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${updatedAt}</td>
                        </tr>
                    </table>
                `;
                
                profileDetails.innerHTML = profileHTML;
            }
            
            // Mettre à jour l'affichage de la photo de profil
            updateProfilePictureDisplay();
        }
    } catch (error) {
        console.error('Get user error:', error);
    }
}

// Mettre à jour l'affichage de la photo de profil
function updateProfilePictureDisplay() {
    if (!currentUser) return;
    
    const profileImage = document.getElementById('profile-image');
    const profilePlaceholder = document.getElementById('profile-placeholder');
    
    if (currentUser.profilePicture) {
        profileImage.src = currentUser.profilePicture;
        profileImage.style.display = 'block';
        profilePlaceholder.style.display = 'none';
    } else {
        profileImage.style.display = 'none';
        profilePlaceholder.style.display = 'block';
    }
}

// Mettre à jour le profil utilisateur
async function updateProfile() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const displayName = document.getElementById('update-display-name').value;
        const firstName = document.getElementById('update-first-name').value;
        const lastName = document.getElementById('update-last-name').value;
        const bio = document.getElementById('update-bio').value;
        
        const data = {};
        if (displayName) data.displayName = displayName;
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        if (bio) data.bio = bio;
        
        if (Object.keys(data).length === 0) {
            alert('Aucune donnée à mettre à jour');
            return;
        }
        
        const result = await apiRequest('/users/me', 'PUT', data);
        
        if (result.status === 'success') {
            alert('Profil mis à jour avec succès!');
            currentUser = result.data;
            updateAuthStatusDisplay();
            
            // Effacer les champs après mise à jour
            document.getElementById('update-display-name').value = '';
            document.getElementById('update-first-name').value = '';
            document.getElementById('update-last-name').value = '';
            document.getElementById('update-bio').value = '';
        }
    } catch (error) {
        console.error('Update profile error:', error);
    }
}

// Changer le mot de passe
async function changePassword() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;
        
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            alert('Tous les champs sont requis');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            alert('Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        
        const result = await apiRequest('/users/me/password', 'PUT', {
            currentPassword,
            newPassword,
            confirmPassword: confirmNewPassword
        });
        
        if (result.status === 'success') {
            alert('Mot de passe changé avec succès!');
            
            // Effacer les champs après succès
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        }
    } catch (error) {
        console.error('Change password error:', error);
    }
}

// Récupérer tous les utilisateurs (admin seulement)
async function getAllUsers() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const result = await apiRequest('/users', 'GET');
        
        if (result.status === 'success' && result.data) {
            // Afficher la liste des utilisateurs
            const usersContainer = document.getElementById('all-users-container');
            
            if (usersContainer) {
                usersContainer.style.display = 'block';
                
                if (!result.data.length) {
                    usersContainer.innerHTML = '<p>Aucun utilisateur trouvé</p>';
                    return;
                }
                
                let usersHTML = '<div class="list-group">';
                
                result.data.forEach(user => {
                    // Formater la date de création
                    const createdDate = new Date(user.createdAt).toLocaleDateString();
                    
                    // Créer un badge pour le rôle
                    let roleBadgeClass = 'badge-primary';
                    if (user.role === 'ADMIN') roleBadgeClass = 'badge-danger';
                    else if (user.role === 'INSTRUCTOR') roleBadgeClass = 'badge-success';
                    else if (user.role === 'GUIDE') roleBadgeClass = 'badge-warning';
                    
                    usersHTML += `
                        <div class="list-item">
                            <div class="list-item-title">
                                ${user.displayName || user.email}
                                <span class="badge ${roleBadgeClass}">${user.role}</span>
                            </div>
                            <div>
                                <small>ID: ${user.id}</small> | 
                                <small>Email: ${user.email}</small> | 
                                <small>Créé le: ${createdDate}</small>
                            </div>
                            <div style="margin-top: 10px;">
                                <button class="btn btn-sm btn-secondary" onclick="fillUserId('${user.id}')">Utiliser ID</button>
                            </div>
                        </div>
                    `;
                });
                
                usersHTML += '</div>';
                usersContainer.innerHTML = usersHTML;
            }
        }
    } catch (error) {
        console.error('Get all users error:', error);
    }
}

// Récupérer un utilisateur par ID
async function getUserById() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const userId = document.getElementById('user-id').value;
        
        if (!userId) {
            alert('ID utilisateur requis');
            return;
        }
        
        await apiRequest(`/users/${userId}`, 'GET');
    } catch (error) {
        console.error('Get user by ID error:', error);
    }
}

// Télécharger ou mettre à jour une photo de profil
async function uploadProfilePicture() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        const profilePictureUrl = document.getElementById('profile-picture-url').value;
        const profilePictureType = document.getElementById('profile-picture-type').value;
        
        if (!profilePictureUrl) {
            alert('URL de photo de profil requise');
            return;
        }
        
        if (!profilePictureType) {
            alert('Type de photo de profil requis');
            return;
        }
        
        // Vérifier si l'URL est valide
        try {
            new URL(profilePictureUrl);
        } catch (e) {
            alert('URL de photo de profil invalide');
            return;
        }
        
        // Envoyer la requête
        const result = await apiRequest('/users/me/profile-picture', 'POST', {
            profilePicture: profilePictureUrl,
            profilePictureType: profilePictureType
        });
        
        if (result.status === 'success') {
            alert('Photo de profil mise à jour avec succès!');
            currentUser = result.data;
            
            // Mettre à jour l'affichage de la photo de profil
            updateProfilePictureDisplay();
            
            // Effacer le champ après la mise à jour
            document.getElementById('profile-picture-url').value = '';
        }
    } catch (error) {
        console.error('Upload profile picture error:', error);
    }
}

// Supprimer la photo de profil
async function deleteProfilePicture() {
    try {
        if (!accessToken) {
            alert('Veuillez vous connecter d\'abord');
            return;
        }
        
        if (!currentUser || !currentUser.profilePicture) {
            alert('Aucune photo de profil à supprimer');
            return;
        }
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil?')) {
            return;
        }
        
        // Envoyer la requête
        const result = await apiRequest('/users/me/profile-picture', 'DELETE');
        
        if (result.status === 'success') {
            alert('Photo de profil supprimée avec succès!');
            currentUser = result.data;
            
            // Mettre à jour l'affichage de la photo de profil
            updateProfilePictureDisplay();
        }
    } catch (error) {
        console.error('Delete profile picture error:', error);
    }
}