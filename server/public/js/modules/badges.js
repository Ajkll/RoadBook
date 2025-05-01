// badges.js - Client-side module for interacting with the badge API

const BadgesModule = (() => {
  // API endpoints
  const API_URL = '/api';
  const BADGES_ENDPOINT = `${API_URL}/badges`;

  // Cache for badges data
  let badgesCache = null;
  let userBadgesCache = null;
  
  /**
   * Get all badges from the API
   */
  const getAllBadges = async () => {
    try {
      if (badgesCache) return badgesCache;
      
      const response = await fetch(BADGES_ENDPOINT);
      if (!response.ok) throw new Error('Failed to fetch badges');
      
      const badges = await response.json();
      badgesCache = badges;
      return badges;
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  };

  /**
   * Get badges for the current user
   */
  const getMyBadges = async () => {
    try {
      if (userBadgesCache) return userBadgesCache;
      
      const response = await fetch(`${BADGES_ENDPOINT}/users/me`, {
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user badges');
      
      const badges = await response.json();
      userBadgesCache = badges;
      return badges;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  };

  /**
   * Get badges for a specific user
   */
  const getUserBadges = async (userId) => {
    try {
      const response = await fetch(`${BADGES_ENDPOINT}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user badges');
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching badges for user ${userId}:`, error);
      throw error;
    }
  };

  /**
   * Get badges by category
   */
  const getBadgesByCategory = async (category) => {
    try {
      const response = await fetch(`${BADGES_ENDPOINT}/categories/${category}`);
      if (!response.ok) throw new Error(`Failed to fetch badges for category ${category}`);
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching badges for category ${category}:`, error);
      throw error;
    }
  };

  /**
   * Get badge leaderboard
   */
  const getLeaderboard = async (limit = 10) => {
    try {
      const response = await fetch(`${BADGES_ENDPOINT}/leaderboard?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch badge leaderboard');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error);
      throw error;
    }
  };

  /**
   * Check for new badges for the current user
   */
  const checkForNewBadges = async () => {
    try {
      const response = await fetch(`${BADGES_ENDPOINT}/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to check for new badges');
      
      const result = await response.json();
      
      // Clear cache if new badges were awarded
      if (result.badges && result.badges.length > 0) {
        userBadgesCache = null;
        
        // Display notification for each new badge
        result.badges.forEach(badge => {
          UIModule.showNotification(
            'Nouveau badge obtenu !', 
            `Vous avez obtenu le badge "${badge.badge.name}" - ${badge.badge.description}`,
            'success',
            5000
          );
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error checking for new badges:', error);
      throw error;
    }
  };

  /**
   * Display user badges in a grid
   */
  const displayUserBadges = async (containerId) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID ${containerId} not found`);
      
      const userBadges = await getMyBadges();
      
      if (userBadges.length === 0) {
        container.innerHTML = '<div class="no-badges">Vous n\'avez pas encore obtenu de badges. Continuez votre progression !</div>';
        return;
      }
      
      container.innerHTML = '';
      const badgesGrid = document.createElement('div');
      badgesGrid.className = 'badges-grid';
      
      userBadges.forEach(userBadge => {
        const badge = userBadge.badge;
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.innerHTML = `
          <div class="badge-image">
            <img src="${badge.imageUrl}" alt="${badge.name}" />
          </div>
          <div class="badge-info">
            <h3>${badge.name}</h3>
            <p>${badge.description}</p>
            <span class="badge-category">${formatCategory(badge.category)}</span>
            <span class="badge-date">Obtenu le ${formatDate(userBadge.awardedAt)}</span>
          </div>
        `;
        badgesGrid.appendChild(badgeElement);
      });
      
      container.appendChild(badgesGrid);
    } catch (error) {
      console.error('Error displaying user badges:', error);
      UIModule.showError('Impossible d\'afficher vos badges. Veuillez réessayer.');
    }
  };

  /**
   * Display badge leaderboard
   */
  const displayLeaderboard = async (containerId, limit = 10) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID ${containerId} not found`);
      
      const leaderboard = await getLeaderboard(limit);
      
      if (leaderboard.length === 0) {
        container.innerHTML = '<div class="no-data">Aucune donnée disponible pour le classement.</div>';
        return;
      }
      
      container.innerHTML = '';
      const leaderboardTable = document.createElement('table');
      leaderboardTable.className = 'leaderboard-table';
      
      leaderboardTable.innerHTML = `
        <thead>
          <tr>
            <th>Rang</th>
            <th>Utilisateur</th>
            <th>Badges</th>
            <th>Badges récents</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      
      const tbody = leaderboardTable.querySelector('tbody');
      
      leaderboard.forEach((user, index) => {
        const row = document.createElement('tr');
        const recentBadges = user.receivedBadges.map(b => 
          `<img src="${b.badge.imageUrl}" title="${b.badge.name}" class="small-badge" />`
        ).join('');
        
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>
            <div class="user-info">
              ${user.profilePicture ? `<img src="${user.profilePicture}" class="user-avatar" />` : ''}
              <span>${user.displayName}</span>
            </div>
          </td>
          <td>${user._count.receivedBadges}</td>
          <td class="recent-badges">${recentBadges}</td>
        `;
        
        tbody.appendChild(row);
      });
      
      container.appendChild(leaderboardTable);
    } catch (error) {
      console.error('Error displaying leaderboard:', error);
      UIModule.showError('Impossible d\'afficher le classement. Veuillez réessayer.');
    }
  };

  /**
   * Format a category string for display
   */
  const formatCategory = (category) => {
    const categories = {
      'BEGINNER': 'Débutant',
      'MANEUVERING': 'Manœuvres',
      'ADVANCED': 'Avancé',
      'SPECIAL': 'Spécial',
      'SOCIAL': 'Social'
    };
    
    return categories[category] || category;
  };

  /**
   * Format a date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Progress indicator to show badge completion status
   */
  const displayBadgeProgress = async (containerId) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container with ID ${containerId} not found`);
      
      // Get all badges and user badges
      const [allBadges, userBadges] = await Promise.all([
        getAllBadges(),
        getMyBadges()
      ]);
      
      const userBadgeIds = userBadges.map(ub => ub.badgeId);
      const totalBadges = allBadges.length;
      const earnedBadges = userBadgeIds.length;
      const progressPercent = Math.round((earnedBadges / totalBadges) * 100);
      
      container.innerHTML = `
        <div class="badge-progress">
          <div class="progress-text">
            <span>${earnedBadges} badges sur ${totalBadges} (${progressPercent}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error displaying badge progress:', error);
      UIModule.showError('Impossible d\'afficher la progression des badges.');
    }
  };

  // Public API
  return {
    getAllBadges,
    getMyBadges,
    getUserBadges,
    getBadgesByCategory,
    getLeaderboard,
    checkForNewBadges,
    displayUserBadges,
    displayLeaderboard,
    displayBadgeProgress
  };
})();

// Add to global API object
if (typeof API !== 'undefined') {
  API.Badges = BadgesModule;
}
