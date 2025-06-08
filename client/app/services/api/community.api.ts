// client/app/services/api/community.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

// Types pour la communauté
export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: {
    id: string;
    displayName: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  images?: string[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: {
    id: string;
    displayName: string;
    profilePicture?: string;
  };
  postId: string;
  createdAt: string;
}

export interface PostWithComments extends CommunityPost {
  comments: Comment[];
}

export interface Like {
  id: string;
  userId: string;
  user?: {
    id: string;
    displayName: string;
    profilePicture?: string;
  };
  postId: string;
  createdAt: string;
}

export interface PaginatedPosts {
  posts: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Service pour gérer les opérations liées à la communauté
 */
export const communityApi = {
  /**
   * Récupérer tous les posts avec pagination
   */
  getPosts: async (page: number = 1, limit: number = 10, tags?: string[]): Promise<PaginatedPosts> => {
    try {
      let url = `/community?page=${page}&limit=${limit}`;
      if (tags && tags.length > 0) {
        url += `&tags=${tags.join(',')}`;
      }
      
      const response = await apiClient.get(url);
      return extractApiData<PaginatedPosts>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch community posts:', error);
      throw error;
    }
  },

  /**
   * Rechercher des posts
   */
  searchPosts: async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedPosts> => {
    try {
      const response = await apiClient.get(`/community/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return extractApiData<PaginatedPosts>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to search posts with query "${query}":`, error);
      throw error;
    }
  },

  /**
   * Créer un nouveau post
   */
  createPost: async (postData: { 
    title: string; 
    content: string; 
    tags?: string[];
    images?: File[];
  }): Promise<CommunityPost> => {
    try {
      let formData = null;
      
      // Si on a des images, utiliser FormData
      if (postData.images && postData.images.length > 0) {
        formData = new FormData();
        formData.append('title', postData.title);
        formData.append('content', postData.content);
        
        if (postData.tags) {
          formData.append('tags', JSON.stringify(postData.tags));
        }
        
        postData.images.forEach((image, index) => {
          formData.append(`images`, image);
        });
        
        const response = await apiClient.post('/community', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return extractApiData<CommunityPost>(response);
      } else {
        // Sinon, envoyer comme JSON normal
        const response = await apiClient.post('/community', postData);
        return extractApiData<CommunityPost>(response);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de post invalides. Le titre et le contenu sont requis.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 413) {
        throw new Error('Les images sont trop volumineuses. Utilisez des images de moins de 5 Mo chacune.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to create post:', error);
      throw error;
    }
  },

  /**
   * Récupérer les posts d'un utilisateur spécifique
   */
  getUserPosts: async (userId: string, page: number = 1, limit: number = 10): Promise<PaginatedPosts> => {
    try {
      const response = await apiClient.get(`/community/users/${userId}?page=${page}&limit=${limit}`);
      return extractApiData<PaginatedPosts>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Utilisateur introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch posts for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer un post spécifique avec ses commentaires
   */
  getPost: async (postId: string): Promise<PostWithComments> => {
    try {
      const response = await apiClient.get(`/community/${postId}`);
      return extractApiData<PostWithComments>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch post with ID ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Mettre à jour un post
   */
  updatePost: async (postId: string, postData: {
    title?: string;
    content?: string;
    tags?: string[];
  }): Promise<CommunityPost> => {
    try {
      const response = await apiClient.put(`/community/${postId}`, postData);
      return extractApiData<CommunityPost>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de post invalides.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour modifier ce post.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to update post with ID ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer un post
   */
  deletePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/community/${postId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour supprimer ce post.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to delete post with ID ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Ajouter un commentaire à un post
   */
  addComment: async (postId: string, commentData: { content: string }): Promise<Comment> => {
    try {
      const response = await apiClient.post(`/community/${postId}/comments`, commentData);
      return extractApiData<Comment>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de commentaire invalides. Le contenu ne peut pas être vide.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to add comment to post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer un commentaire
   */
  deleteComment: async (commentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/community/comments/${commentId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour supprimer ce commentaire.');
      } else if (error.response?.status === 404) {
        throw new Error('Commentaire introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to delete comment with ID ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Aimer un post
   */
  likePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.post(`/community/${postId}/likes`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (error.response?.status === 409) {
        throw new Error('Vous avez déjà aimé ce post.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to like post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Ne plus aimer un post
   */
  unlikePost: async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/community/${postId}/likes`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable ou vous n\'avez pas aimé ce post.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to unlike post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer les utilisateurs qui ont aimé un post
   */
  getPostLikes: async (postId: string): Promise<Like[]> => {
    try {
      const response = await apiClient.get(`/community/${postId}/likes`);
      return extractApiData<Like[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get likes for post ${postId}:`, error);
      throw error;
    }
  },

  /**
   * Vérifier si l'utilisateur a aimé un post
   */
  checkPostLike: async (postId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/community/${postId}/likes/check`);
      return extractApiData<{ liked: boolean }>(response).liked;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Post introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to check like status for post ${postId}:`, error);
      throw error;
    }
  }
};

export default communityApi;