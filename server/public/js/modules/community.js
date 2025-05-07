// community.js - Client-side module for interacting with the community API

const CommunityModule = (() => {
  // API endpoints
  const API_URL = '/api';
  const COMMUNITY_ENDPOINT = `${API_URL}/community`;

  // Cache for frequently accessed data
  let postsCache = null;
  let postsTimestamp = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Helper function for adding pagination and sort params to URLs
   */
  const addParams = (url, params = {}) => {
    const urlObj = new URL(url, window.location.origin);
    
    // Add pagination params
    if (params.page) urlObj.searchParams.append('page', params.page);
    if (params.limit) urlObj.searchParams.append('limit', params.limit);
    if (params.sort) urlObj.searchParams.append('sort', params.sort);
    if (params.order) urlObj.searchParams.append('order', params.order);
    
    // Add other params
    Object.entries(params).forEach(([key, value]) => {
      if (!['page', 'limit', 'sort', 'order'].includes(key) && value !== undefined) {
        urlObj.searchParams.append(key, value);
      }
    });
    
    return urlObj.toString();
  };

  /**
   * Get posts with pagination
   */
  const getPosts = async (params = {}) => {
    try {
      // Check cache if no specific params requested
      const isDefaultRequest = !params.page && !params.limit && !params.sort && !params.order;
      const now = Date.now();
      
      if (isDefaultRequest && postsCache && now - postsTimestamp < CACHE_DURATION) {
        return postsCache;
      }
      
      const url = addParams(COMMUNITY_ENDPOINT, params);
      
      const response = await fetch(url, {
        headers: AuthModule.getToken() ? {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const result = await response.json();
      
      // Cache default results
      if (isDefaultRequest) {
        postsCache = result;
        postsTimestamp = now;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  };

  /**
   * Get a single post by ID with its comments
   */
  const getPost = async (postId) => {
    try {
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}`, {
        headers: AuthModule.getToken() ? {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        } : {}
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view this post');
        }
        throw new Error('Failed to fetch post');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Create a new post
   */
  const createPost = async (postData) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to create a post');
      }
      
      const response = await fetch(COMMUNITY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthModule.getToken()}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }
      
      // Invalidate cache
      postsCache = null;
      
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  /**
   * Update an existing post
   */
  const updatePost = async (postId, postData) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to update a post');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthModule.getToken()}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update post');
      }
      
      // Invalidate cache
      postsCache = null;
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Delete a post
   */
  const deletePost = async (postId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to delete a post');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete post');
      }
      
      // Invalidate cache
      postsCache = null;
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Add a comment to a post
   */
  const addComment = async (postId, content) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to comment');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthModule.getToken()}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add comment');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to delete a comment');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete comment');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  };

  /**
   * Like a post
   */
  const likePost = async (postId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to like a post');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}/likes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like post');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error liking post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Unlike a post
   */
  const unlikePost = async (postId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        throw new Error('You must be logged in to unlike a post');
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}/likes`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unlike post');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error unliking post ${postId}:`, error);
      throw error;
    }
  };

  /**
   * Check if user has liked a post
   */
  const hasUserLikedPost = async (postId) => {
    try {
      if (!AuthModule.isAuthenticated()) {
        return false;
      }
      
      const response = await fetch(`${COMMUNITY_ENDPOINT}/${postId}/likes/check`, {
        headers: {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        }
      });
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.hasLiked;
    } catch (error) {
      console.error(`Error checking like status for post ${postId}:`, error);
      return false;
    }
  };

  /**
   * Get posts by a specific user
   */
  const getPostsByUser = async (userId, params = {}) => {
    try {
      const url = addParams(`${COMMUNITY_ENDPOINT}/users/${userId}`, params);
      
      const response = await fetch(url, {
        headers: AuthModule.getToken() ? {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Failed to fetch user posts');
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      throw error;
    }
  };

  /**
   * Search posts
   */
  const searchPosts = async (query, params = {}) => {
    try {
      const searchParams = { ...params, q: query };
      const url = addParams(`${COMMUNITY_ENDPOINT}/search`, searchParams);
      
      const response = await fetch(url, {
        headers: AuthModule.getToken() ? {
          'Authorization': `Bearer ${AuthModule.getToken()}`
        } : {}
      });
      
      if (!response.ok) throw new Error('Failed to search posts');
      
      return await response.json();
    } catch (error) {
      console.error(`Error searching posts with query "${query}":`, error);
      throw error;
    }
  };

  /**
   * Render a post feed with pagination
   */
  const renderPostsFeed = async (containerId, params = {}) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID ${containerId} not found`);
      }
      
      // Clear container or show loading
      container.innerHTML = '<div class="loading">Chargement des publications...</div>';
      
      // Fetch posts
      const result = await getPosts(params);
      
      // Clear container
      container.innerHTML = '';
      
      if (result.posts.length === 0) {
        container.innerHTML = '<div class="no-posts">Aucune publication trouvée</div>';
        return;
      }
      
      // Create posts container
      const postsContainer = document.createElement('div');
      postsContainer.className = 'posts-container';
      
      // Render each post
      result.posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
      });
      
      // Add pagination controls
      const paginationElement = createPaginationElement(result.pages, params.page || 1, (newPage) => {
        renderPostsFeed(containerId, { ...params, page: newPage });
      });
      
      // Add everything to container
      container.appendChild(postsContainer);
      container.appendChild(paginationElement);
    } catch (error) {
      console.error('Error rendering posts feed:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div class="error">Erreur lors du chargement des publications</div>';
      }
    }
  };

  /**
   * Helper function to create a post element
   */
  const createPostElement = (post) => {
    const element = document.createElement('div');
    element.className = 'post-card';
    element.dataset.postId = post.id;
    
    // Format date
    const postDate = new Date(post.createdAt);
    const formattedDate = postDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Truncate content if too long
    const truncatedContent = post.content.length > 200 
      ? `${post.content.substring(0, 200)}...` 
      : post.content;
    
    element.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          ${post.author.profilePicture 
            ? `<img src="${post.author.profilePicture}" alt="${post.author.displayName}" class="author-avatar" />` 
            : '<div class="author-avatar author-avatar-placeholder"></div>'}
          <div class="author-info">
            <span class="author-name">${post.author.displayName}</span>
            <span class="author-role">${formatUserRole(post.author.role)}</span>
          </div>
        </div>
        <span class="post-date">${formattedDate}</span>
      </div>
      <h3 class="post-title">${post.title}</h3>
      <div class="post-content">${truncatedContent}</div>
      ${post.mediaUrls && post.mediaUrls.length > 0 ? 
        `<div class="post-media">
          ${post.mediaUrls.map(url => `
            <img src="${url}" alt="Media" class="post-media-item" />
          `).join('')}
        </div>` : ''}
      <div class="post-footer">
        <div class="post-stats">
          <span class="post-likes">${post._count?.likes || 0} likes</span>
          <span class="post-comments">${post._count?.comments || 0} commentaires</span>
        </div>
        <a href="/community/posts/${post.id}" class="view-post-link">Voir plus</a>
      </div>
    `;
    
    // Add event listeners
    const viewLink = element.querySelector('.view-post-link');
    viewLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPost(post.id);
    });
    
    return element;
  };

  /**
   * Helper function to create pagination element
   */
  const createPaginationElement = (totalPages, currentPage, onPageChange) => {
    const element = document.createElement('div');
    element.className = 'pagination-controls';
    
    if (totalPages <= 1) {
      return element; // No pagination needed
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Précédent';
    prevButton.disabled = currentPage <= 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    });
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Suivant &raquo;';
    nextButton.disabled = currentPage >= totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    });
    
    // Page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'page-indicator';
    pageIndicator.textContent = `Page ${currentPage} sur ${totalPages}`;
    
    // Add all elements
    element.appendChild(prevButton);
    element.appendChild(pageIndicator);
    element.appendChild(nextButton);
    
    return element;
  };

  /**
   * Helper function to format user role
   */
  const formatUserRole = (role) => {
    const roles = {
      'APPRENTICE': 'Apprenti',
      'GUIDE': 'Guide',
      'INSTRUCTOR': 'Instructeur',
      'ADMIN': 'Administrateur'
    };
    
    return roles[role] || role;
  };

  /**
   * Helper function to navigate to a post detail page
   */
  const navigateToPost = (postId) => {
    // This would be replaced with actual navigation logic
    // For now just update URL and trigger a custom event
    window.history.pushState({}, '', `/community/posts/${postId}`);
    
    // Dispatch event for SPA routing
    const event = new CustomEvent('spa-navigation', { 
      detail: { path: `/community/posts/${postId}` } 
    });
    window.dispatchEvent(event);
  };

  /**
   * Render detailed post view with comments
   */
  const renderPostDetail = async (containerId, postId) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID ${containerId} not found`);
      }
      
      // Show loading state
      container.innerHTML = '<div class="loading">Chargement de la publication...</div>';
      
      // Fetch post with comments
      const post = await getPost(postId);
      
      // Reset container
      container.innerHTML = '';
      
      // Create post detail element
      const postDetailElement = document.createElement('div');
      postDetailElement.className = 'post-detail';
      
      // Format date
      const postDate = new Date(post.createdAt);
      const formattedDate = postDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Check if user has liked the post
      const hasLiked = await hasUserLikedPost(postId);
      
      // Generate HTML
      postDetailElement.innerHTML = `
        <div class="post-header">
          <div class="post-author">
            ${post.author.profilePicture 
              ? `<img src="${post.author.profilePicture}" alt="${post.author.displayName}" class="author-avatar" />` 
              : '<div class="author-avatar author-avatar-placeholder"></div>'}
            <div class="author-info">
              <span class="author-name">${post.author.displayName}</span>
              <span class="author-role">${formatUserRole(post.author.role)}</span>
            </div>
          </div>
          <span class="post-date">${formattedDate}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <div class="post-content">${post.content}</div>
        ${post.mediaUrls && post.mediaUrls.length > 0 ? 
          `<div class="post-media">
            ${post.mediaUrls.map(url => `
              <img src="${url}" alt="Media" class="post-media-item" />
            `).join('')}
          </div>` : ''}
        <div class="post-actions">
          <button class="like-button ${hasLiked ? 'liked' : ''}" id="like-button-${post.id}">
            ${hasLiked ? 'Aimé' : 'J\'aime'} (${post._count?.likes || 0})
          </button>
          <button class="share-button" id="share-button-${post.id}">Partager</button>
          ${post.author.id === AuthModule.getCurrentUser()?.id || 
            AuthModule.getCurrentUser()?.role === 'ADMIN' ? 
            `<button class="delete-button" id="delete-button-${post.id}">Supprimer</button>` : ''}
          ${post.author.id === AuthModule.getCurrentUser()?.id ? 
            `<button class="edit-button" id="edit-button-${post.id}">Modifier</button>` : ''}
        </div>
        
        <div class="comments-section">
          <h3 class="comments-title">Commentaires (${post.comments?.length || 0})</h3>
          
          ${AuthModule.isAuthenticated() ? `
            <div class="comment-form">
              <textarea id="comment-input" placeholder="Ajouter un commentaire..."></textarea>
              <button id="submit-comment">Commenter</button>
            </div>
          ` : `
            <div class="login-prompt">
              <a href="/login">Connectez-vous</a> pour commenter
            </div>
          `}
          
          <div class="comments-list">
            ${post.comments?.length > 0 ? post.comments.map(comment => `
              <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                  <div class="comment-author">
                    ${comment.author.profilePicture 
                      ? `<img src="${comment.author.profilePicture}" alt="${comment.author.displayName}" class="author-avatar-small" />` 
                      : '<div class="author-avatar-small author-avatar-placeholder"></div>'}
                    <span class="author-name">${comment.author.displayName}</span>
                  </div>
                  <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                ${comment.author.id === AuthModule.getCurrentUser()?.id ||
                  post.author.id === AuthModule.getCurrentUser()?.id ||
                  AuthModule.getCurrentUser()?.role === 'ADMIN' ? 
                  `<button class="delete-comment" data-comment-id="${comment.id}">Supprimer</button>` : ''}
              </div>
            `).join('') : '<div class="no-comments">Aucun commentaire pour le moment</div>'}
          </div>
        </div>
      `;
      
      // Add to container
      container.appendChild(postDetailElement);
      
      // Add event listeners
      if (AuthModule.isAuthenticated()) {
        // Like button
        const likeButton = document.getElementById(`like-button-${post.id}`);
        likeButton.addEventListener('click', async () => {
          try {
            if (hasLiked) {
              await unlikePost(post.id);
              likeButton.classList.remove('liked');
              likeButton.textContent = `J'aime (${(post._count?.likes || 0) - 1})`;
            } else {
              await likePost(post.id);
              likeButton.classList.add('liked');
              likeButton.textContent = `Aimé (${(post._count?.likes || 0) + 1})`;
            }
          } catch (error) {
            UIModule.showNotification('error', error.message);
          }
        });
        
        // Comment submission
        const commentForm = container.querySelector('.comment-form');
        if (commentForm) {
          const commentInput = document.getElementById('comment-input');
          const submitButton = document.getElementById('submit-comment');
          
          submitButton.addEventListener('click', async () => {
            try {
              const content = commentInput.value.trim();
              if (!content) return;
              
              const comment = await addComment(post.id, content);
              
              // Clear input
              commentInput.value = '';
              
              // Add comment to list
              const commentsList = container.querySelector('.comments-list');
              const noCommentsElement = commentsList.querySelector('.no-comments');
              if (noCommentsElement) {
                commentsList.innerHTML = '';
              }
              
              const commentElement = document.createElement('div');
              commentElement.className = 'comment';
              commentElement.dataset.commentId = comment.id;
              
              commentElement.innerHTML = `
                <div class="comment-header">
                  <div class="comment-author">
                    ${comment.author.profilePicture 
                      ? `<img src="${comment.author.profilePicture}" alt="${comment.author.displayName}" class="author-avatar-small" />` 
                      : '<div class="author-avatar-small author-avatar-placeholder"></div>'}
                    <span class="author-name">${comment.author.displayName}</span>
                  </div>
                  <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <button class="delete-comment" data-comment-id="${comment.id}">Supprimer</button>
              `;
              
              // Add comment to list
              commentsList.prepend(commentElement);
              
              // Add delete event listener
              const deleteButton = commentElement.querySelector('.delete-comment');
              deleteButton.addEventListener('click', async () => {
                try {
                  await deleteComment(comment.id);
                  commentElement.remove();
                } catch (error) {
                  UIModule.showNotification('error', error.message);
                }
              });
              
              // Update comment count
              const commentsTitle = container.querySelector('.comments-title');
              const currentCount = parseInt(commentsTitle.textContent.match(/\d+/)[0], 10);
              commentsTitle.textContent = `Commentaires (${currentCount + 1})`;
            } catch (error) {
              UIModule.showNotification('error', error.message);
            }
          });
        }
        
        // Delete post button
        const deletePostButton = document.getElementById(`delete-button-${post.id}`);
        if (deletePostButton) {
          deletePostButton.addEventListener('click', async () => {
            try {
              if (confirm('Êtes-vous sûr de vouloir supprimer cette publication?')) {
                await deletePost(post.id);
                // Navigate back to community feed
                window.history.pushState({}, '', '/community');
                window.dispatchEvent(new CustomEvent('spa-navigation', { 
                  detail: { path: '/community' } 
                }));
              }
            } catch (error) {
              UIModule.showNotification('error', error.message);
            }
          });
        }
        
        // Delete comment buttons
        const deleteCommentButtons = container.querySelectorAll('.delete-comment');
        deleteCommentButtons.forEach(button => {
          button.addEventListener('click', async () => {
            try {
              const commentId = button.dataset.commentId;
              await deleteComment(commentId);
              
              // Remove comment element
              const commentElement = button.closest('.comment');
              commentElement.remove();
              
              // Update comment count
              const commentsTitle = container.querySelector('.comments-title');
              const currentCount = parseInt(commentsTitle.textContent.match(/\d+/)[0], 10);
              commentsTitle.textContent = `Commentaires (${currentCount - 1})`;
            } catch (error) {
              UIModule.showNotification('error', error.message);
            }
          });
        });
        
        // Share button
        const shareButton = document.getElementById(`share-button-${post.id}`);
        shareButton.addEventListener('click', () => {
          const url = window.location.origin + `/community/posts/${post.id}`;
          
          if (navigator.share) {
            navigator.share({
              title: post.title,
              text: 'Découvrez cette publication sur RoadBook',
              url: url
            });
          } else {
            // Fallback for browsers that don't support navigator.share
            navigator.clipboard.writeText(url).then(() => {
              UIModule.showNotification('success', 'Lien copié dans le presse-papiers');
            });
          }
        });
        
        // Edit post button
        const editPostButton = document.getElementById(`edit-button-${post.id}`);
        if (editPostButton) {
          editPostButton.addEventListener('click', () => {
            // Simple inline edit form
            const postTitle = container.querySelector('.post-title');
            const postContent = container.querySelector('.post-content');
            
            // Save original values
            const originalTitle = postTitle.textContent;
            const originalContent = postContent.textContent;
            
            // Replace with edit form
            postTitle.innerHTML = `<input type="text" id="edit-title" value="${originalTitle}">`;
            postContent.innerHTML = `<textarea id="edit-content">${originalContent}</textarea>
                                     <div class="edit-buttons">
                                       <button id="save-edit">Enregistrer</button>
                                       <button id="cancel-edit">Annuler</button>
                                     </div>`;
            
            // Add event listeners
            const saveButton = document.getElementById('save-edit');
            const cancelButton = document.getElementById('cancel-edit');
            
            saveButton.addEventListener('click', async () => {
              try {
                const newTitle = document.getElementById('edit-title').value.trim();
                const newContent = document.getElementById('edit-content').value.trim();
                
                if (!newTitle || !newContent) {
                  UIModule.showNotification('error', 'Le titre et le contenu sont requis');
                  return;
                }
                
                const updatedPost = await updatePost(post.id, {
                  title: newTitle,
                  content: newContent
                });
                
                // Update UI
                postTitle.innerHTML = updatedPost.title;
                postContent.innerHTML = updatedPost.content;
                
                UIModule.showNotification('success', 'Publication mise à jour');
              } catch (error) {
                UIModule.showNotification('error', error.message);
              }
            });
            
            cancelButton.addEventListener('click', () => {
              postTitle.innerHTML = originalTitle;
              postContent.innerHTML = originalContent;
            });
          });
        }
      }
      
    } catch (error) {
      console.error(`Error rendering post detail for ${postId}:`, error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
      }
    }
  };

  /**
   * Create a new post form
   */
  const renderCreatePostForm = (containerId, onPostCreated) => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID ${containerId} not found`);
      }
      
      if (!AuthModule.isAuthenticated()) {
        container.innerHTML = `
          <div class="login-prompt">
            <p>Vous devez être connecté pour créer une publication</p>
            <a href="/login" class="login-button">Se connecter</a>
          </div>
        `;
        return;
      }
      
      // Create form
      const form = document.createElement('form');
      form.className = 'create-post-form';
      form.innerHTML = `
        <h3>Créer une nouvelle publication</h3>
        <div class="form-group">
          <label for="post-title">Titre</label>
          <input type="text" id="post-title" placeholder="Titre de votre publication" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="post-content">Contenu</label>
          <textarea id="post-content" placeholder="Partagez votre expérience..." required maxlength="5000"></textarea>
        </div>
        <div class="form-group">
          <label for="post-media">Images (URLs séparées par des virgules)</label>
          <input type="text" id="post-media" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg">
        </div>
        <div class="form-actions">
          <button type="submit" id="create-post-button">Publier</button>
        </div>
      `;
      
      container.innerHTML = '';
      container.appendChild(form);
      
      // Add event listener
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const title = document.getElementById('post-title').value.trim();
          const content = document.getElementById('post-content').value.trim();
          const mediaInput = document.getElementById('post-media').value.trim();
          
          // Parse media URLs
          const mediaUrls = mediaInput ? 
            mediaInput.split(',').map(url => url.trim()).filter(url => url) : 
            [];
          
          // Validate URLs
          const validUrls = mediaUrls.every(url => {
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          });
          
          if (!validUrls) {
            UIModule.showNotification('error', 'Les URLs des images sont invalides');
            return;
          }
          
          // Create post
          const post = await createPost({ title, content, mediaUrls });
          
          // Clear form
          form.reset();
          
          // Notify
          UIModule.showNotification('success', 'Publication créée avec succès');
          
          // Callback
          if (typeof onPostCreated === 'function') {
            onPostCreated(post);
          }
        } catch (error) {
          UIModule.showNotification('error', error.message);
        }
      });
    } catch (error) {
      console.error('Error rendering create post form:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
      }
    }
  };

  // Public API
  return {
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    likePost,
    unlikePost,
    hasUserLikedPost,
    getPostsByUser,
    searchPosts,
    renderPostsFeed,
    renderPostDetail,
    renderCreatePostForm
  };
})();

// Add to global API object
if (typeof API !== 'undefined') {
  API.Community = CommunityModule;
}