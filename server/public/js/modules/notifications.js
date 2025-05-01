// notifications.js - Client-side module for interacting with the notifications API

const NotificationsModule = (() => {
  // API endpoints
  const API_URL = '/api';
  const NOTIFICATIONS_ENDPOINT = `${API_URL}/notifications`;
  
  // Cache for notification data
  let notificationsCache = null;
  let notificationsCacheTimestamp = 0;
  let unreadCountCache = 0;
  let unreadCountCacheTimestamp = 0;
  
  // Cache duration in milliseconds (1 minute)
  const CACHE_DURATION = 60 * 1000;
  
  // Polling interval for checking notifications (in milliseconds)
  const POLLING_INTERVAL = 30 * 1000; // 30 seconds
  
  // Polling timer reference
  let pollingTimer = null;
  
  /**
   * Get all notifications for the current user
   */
  const getNotifications = async (params = {}) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const { includeRead = true, page = 1, limit = 20 } = params;
      
      // Check cache for default request
      const now = Date.now();
      if (!params.page && !params.limit && notificationsCache && 
          now - notificationsCacheTimestamp < CACHE_DURATION) {
        return notificationsCache;
      }
      
      // Build URL with query parameters
      let url = NOTIFICATIONS_ENDPOINT;
      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (!includeRead) queryParams.append('includeRead', 'false');
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const result = await response.json();
      
      // Cache results for default request
      if (!params.page && !params.limit) {
        notificationsCache = result;
        notificationsCacheTimestamp = now;
        
        // Update unread count cache
        unreadCountCache = result.unreadCount;
        unreadCountCacheTimestamp = now;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  };
  
  /**
   * Get unread notification count
   */
  const getUnreadCount = async (forceRefresh = false) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        return 0;
      }
      
      // Check cache
      const now = Date.now();
      if (!forceRefresh && unreadCountCacheTimestamp > 0 && 
          now - unreadCountCacheTimestamp < CACHE_DURATION) {
        return unreadCountCache;
      }
      
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      const { count } = await response.json();
      
      // Update cache
      unreadCountCache = count;
      unreadCountCacheTimestamp = now;
      
      return count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  };
  
  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Invalidate caches
      notificationsCache = null;
      unreadCountCache = Math.max(0, unreadCountCache - 1);
      
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Invalidate caches
      notificationsCache = null;
      unreadCountCache = 0;
      
      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };
  
  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Invalidate cache
      notificationsCache = null;
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };
  
  /**
   * Delete all notifications
   */
  const deleteAllNotifications = async () => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(NOTIFICATIONS_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }
      
      // Reset caches
      notificationsCache = null;
      unreadCountCache = 0;
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };
  
  /**
   * Start polling for notifications
   */
  const startPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    // Initial check
    getUnreadCount(true);
    
    // Set up polling
    pollingTimer = setInterval(async () => {
      if (AuthModule.isAuthenticated()) {
        const newCount = await getUnreadCount(true);
        
        // If new notifications, update UI indicator
        if (newCount > 0) {
          updateNotificationIndicator(newCount);
        }
      } else {
        // Not authenticated, stop polling
        stopPolling();
      }
    }, POLLING_INTERVAL);
  };
  
  /**
   * Stop polling for notifications
   */
  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };
  
  /**
   * Update UI notification indicator
   */
  const updateNotificationIndicator = (count) => {
    const indicator = document.getElementById('notification-indicator');
    if (indicator) {
      if (count > 0) {
        indicator.textContent = count > 99 ? '99+' : count.toString();
        indicator.classList.remove('hidden');
      } else {
        indicator.textContent = '';
        indicator.classList.add('hidden');
      }
    }
  };
  
  /**
   * Display notifications dropdown or panel
   */
  const displayNotifications = async (containerId, options = {}) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID ${containerId} not found`);
      }
      
      if (!AuthModule.isAuthenticated()) {
        container.innerHTML = `
          <div class="notifications-auth-required">
            <p>Connectez-vous pour voir vos notifications</p>
          </div>
        `;
        return;
      }
      
      // Show loading state
      container.innerHTML = '<div class="loading">Chargement des notifications...</div>';
      
      // Fetch notifications
      const { page = 1, limit = 5, includeRead = true } = options;
      const result = await getNotifications({ page, limit, includeRead });
      
      if (result.notifications.length === 0) {
        container.innerHTML = `
          <div class="no-notifications">
            <p>Vous n'avez pas de notifications${!includeRead ? ' non lues' : ''}</p>
          </div>
        `;
        
        if (!includeRead) {
          // Add option to view all if showing only unread
          const viewAllButton = document.createElement('button');
          viewAllButton.className = 'view-all-button';
          viewAllButton.textContent = 'Voir toutes les notifications';
          viewAllButton.addEventListener('click', () => {
            displayNotifications(containerId, { ...options, includeRead: true });
          });
          container.appendChild(viewAllButton);
        }
        
        return;
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Create notifications list
      const notificationsList = document.createElement('div');
      notificationsList.className = 'notifications-list';
      
      // Add notifications
      result.notifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationsList.appendChild(notificationElement);
      });
      
      // Add pagination if needed
      if (result.total > limit) {
        const paginationElement = createPaginationElement(
          Math.ceil(result.total / limit),
          page,
          newPage => {
            displayNotifications(containerId, { ...options, page: newPage });
          }
        );
        container.appendChild(paginationElement);
      }
      
      // Add controls
      const controlsElement = document.createElement('div');
      controlsElement.className = 'notification-controls';
      
      // Mark all as read button
      if (result.unreadCount > 0) {
        const markAllReadButton = document.createElement('button');
        markAllReadButton.textContent = 'Tout marquer comme lu';
        markAllReadButton.className = 'mark-all-read-button';
        markAllReadButton.addEventListener('click', async () => {
          try {
            await markAllAsRead();
            // Refresh display
            displayNotifications(containerId, options);
          } catch (error) {
            console.error('Error marking all as read:', error);
          }
        });
        controlsElement.appendChild(markAllReadButton);
      }
      
      // Toggle button to show/hide read notifications
      const toggleReadButton = document.createElement('button');
      toggleReadButton.textContent = includeRead 
        ? 'Masquer les notifications lues' 
        : 'Voir toutes les notifications';
      toggleReadButton.className = 'toggle-read-button';
      toggleReadButton.addEventListener('click', () => {
        displayNotifications(containerId, { ...options, includeRead: !includeRead });
      });
      controlsElement.appendChild(toggleReadButton);
      
      // Add everything to container
      container.appendChild(notificationsList);
      container.appendChild(controlsElement);
      
      // Update notification indicator
      updateNotificationIndicator(result.unreadCount);
    } catch (error) {
      console.error('Error displaying notifications:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="error-message">
            <p>Erreur lors du chargement des notifications</p>
          </div>
        `;
      }
    }
  };
  
  /**
   * Create a notification element
   */
  const createNotificationElement = (notification) => {
    const element = document.createElement('div');
    element.className = `notification-item ${notification.isRead ? 'read' : 'unread'}`;
    element.dataset.id = notification.id;
    element.dataset.type = notification.type;
    
    // Format date
    const date = new Date(notification.createdAt);
    const formattedDate = formatTimeAgo(date);
    
    // Create notification content
    element.innerHTML = `
      <div class="notification-content">
        <h4 class="notification-title">${notification.title}</h4>
        <p class="notification-message">${notification.message}</p>
        <div class="notification-meta">
          <span class="notification-time">${formattedDate}</span>
          ${notification.isRead ? '' : '<span class="unread-indicator"></span>'}
        </div>
      </div>
      <div class="notification-actions">
        ${notification.isRead ? '' : `
          <button class="mark-read-button" title="Marquer comme lu">
            <span class="icon">✓</span>
          </button>
        `}
        <button class="delete-button" title="Supprimer">
          <span class="icon">×</span>
        </button>
      </div>
    `;
    
    // Add event listeners
    if (!notification.isRead) {
      const markReadButton = element.querySelector('.mark-read-button');
      if (markReadButton) {
        markReadButton.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await markAsRead(notification.id);
            element.classList.remove('unread');
            element.classList.add('read');
            markReadButton.remove();
            element.querySelector('.unread-indicator')?.remove();
          } catch (error) {
            console.error('Error marking notification as read:', error);
          }
        });
      }
    }
    
    const deleteButton = element.querySelector('.delete-button');
    if (deleteButton) {
      deleteButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await deleteNotification(notification.id);
          element.remove();
        } catch (error) {
          console.error('Error deleting notification:', error);
        }
      });
    }
    
    // Make entire notification clickable
    element.addEventListener('click', () => {
      // Mark as read if unread
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      
      // Navigate to link if provided
      if (notification.linkUrl) {
        window.location.href = notification.linkUrl;
      }
    });
    
    return element;
  };
  
  /**
   * Create pagination element
   */
  const createPaginationElement = (totalPages, currentPage, onPageChange) => {
    const element = document.createElement('div');
    element.className = 'pagination';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '« Précédent';
    prevButton.disabled = currentPage <= 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    });
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Suivant »';
    nextButton.disabled = currentPage >= totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    });
    
    // Page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'page-indicator';
    pageIndicator.textContent = `Page ${currentPage} / ${totalPages}`;
    
    // Add all elements
    element.appendChild(prevButton);
    element.appendChild(pageIndicator);
    element.appendChild(nextButton);
    
    return element;
  };
  
  /**
   * Format relative time
   */
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) {
      return 'à l\'instant';
    }
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    
    // Default to standard date format
    return date.toLocaleDateString('fr-FR');
  };
  
  /**
   * Initialize the notifications system
   */
  const initialize = () => {
    // Start polling for new notifications if authenticated
    if (AuthModule.isAuthenticated()) {
      startPolling();
    }
    
    // Listen for authentication state changes
    document.addEventListener('auth-state-changed', (event) => {
      const isAuthenticated = event.detail?.isAuthenticated;
      
      if (isAuthenticated) {
        startPolling();
      } else {
        stopPolling();
        // Reset caches
        notificationsCache = null;
        unreadCountCache = 0;
      }
    });
  };
  
  // Initialize on module load
  initialize();
  
  // Public API
  return {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    displayNotifications,
    updateNotificationIndicator
  };
})();

// Add to global API object
if (typeof API !== 'undefined') {
  API.Notifications = NotificationsModule;
}