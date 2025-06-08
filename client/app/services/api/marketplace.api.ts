// client/app/services/api/marketplace.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

// Types pour le marketplace
export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  sellerId: string;
  seller?: {
    id: string;
    displayName: string;
    profilePicture?: string;
  };
  status: 'ACTIVE' | 'SOLD' | 'PAUSED' | 'ARCHIVED';
  images?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
  rating?: number;
  ratingCount?: number;
}

export interface PaginatedListings {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MarketplacePurchase {
  id: string;
  listingId: string;
  listing?: MarketplaceListing;
  buyerId: string;
  quantity: number;
  totalPrice: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPurchases {
  purchases: MarketplacePurchase[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PurchaseRequest {
  listingId: string;
  quantity: number;
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  paymentDetails?: any;
}

/**
 * Service pour gérer les opérations liées au marketplace
 */
export const marketplaceApi = {
  /**
   * Récupérer toutes les annonces avec filtrage
   */
  getListings: async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      tags?: string[];
      status?: 'ACTIVE' | 'SOLD' | 'PAUSED' | 'ARCHIVED';
    }
  ): Promise<PaginatedListings> => {
    try {
      let url = `/marketplace?page=${page}&limit=${limit}`;
      
      if (filters) {
        if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
        if (filters.minPrice !== undefined) url += `&minPrice=${filters.minPrice}`;
        if (filters.maxPrice !== undefined) url += `&maxPrice=${filters.maxPrice}`;
        if (filters.tags && filters.tags.length > 0) url += `&tags=${filters.tags.join(',')}`;
        if (filters.status) url += `&status=${filters.status}`;
      }
      
      const response = await apiClient.get(url);
      return extractApiData<PaginatedListings>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch marketplace listings:', error);
      throw error;
    }
  },

  /**
   * Rechercher des annonces
   */
  searchListings: async (query: string, page: number = 1, limit: number = 10): Promise<PaginatedListings> => {
    try {
      const response = await apiClient.get(`/marketplace/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return extractApiData<PaginatedListings>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to search listings with query "${query}":`, error);
      throw error;
    }
  },

  /**
   * Récupérer les annonces du vendeur authentifié
   */
  getSellerListings: async (page: number = 1, limit: number = 10): Promise<PaginatedListings> => {
    try {
      const response = await apiClient.get(`/marketplace/seller?page=${page}&limit=${limit}`);
      return extractApiData<PaginatedListings>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch seller listings:', error);
      throw error;
    }
  },

  /**
   * Récupérer l'historique des achats de l'utilisateur authentifié
   */
  getPurchaseHistory: async (page: number = 1, limit: number = 10): Promise<PaginatedPurchases> => {
    try {
      const response = await apiClient.get(`/marketplace/purchases?page=${page}&limit=${limit}`);
      return extractApiData<PaginatedPurchases>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch purchase history:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails d'un achat
   */
  getPurchaseDetails: async (purchaseId: string): Promise<MarketplacePurchase> => {
    try {
      const response = await apiClient.get(`/marketplace/purchases/${purchaseId}`);
      return extractApiData<MarketplacePurchase>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à cet achat.');
      } else if (error.response?.status === 404) {
        throw new Error('Achat introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch purchase details for purchase ${purchaseId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer les détails d'une annonce
   */
  getListingDetails: async (listingId: string): Promise<MarketplaceListing> => {
    try {
      const response = await apiClient.get(`/marketplace/${listingId}`);
      return extractApiData<MarketplaceListing>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch listing details for listing ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer les achats pour une annonce spécifique
   */
  getListingPurchases: async (listingId: string, page: number = 1, limit: number = 10): Promise<PaginatedPurchases> => {
    try {
      const response = await apiClient.get(`/marketplace/${listingId}/purchases?page=${page}&limit=${limit}`);
      return extractApiData<PaginatedPurchases>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à ces achats.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch purchases for listing ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle annonce
   */
  createListing: async (listingData: {
    title: string;
    description: string;
    price: number;
    currency?: string;
    category: string;
    tags?: string[];
    availableQuantity: number;
    images?: File[];
  }): Promise<MarketplaceListing> => {
    try {
      let formData = null;
      let response = null;
      
      // Si on a des images, utiliser FormData
      if (listingData.images && listingData.images.length > 0) {
        formData = new FormData();
        
        // Ajouter tous les champs au formData
        for (const [key, value] of Object.entries(listingData)) {
          if (key !== 'images') {
            if (typeof value === 'object' && !Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        }
        
        // Ajouter les images
        listingData.images.forEach((image, index) => {
          formData.append(`images`, image);
        });
        
        response = await apiClient.post('/marketplace', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Sinon, envoyer comme JSON normal
        response = await apiClient.post('/marketplace', listingData);
      }
      
      return extractApiData<MarketplaceListing>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données d\'annonce invalides. Vérifiez tous les champs requis.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 413) {
        throw new Error('Les images sont trop volumineuses. Utilisez des images de moins de 5 Mo chacune.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to create listing:', error);
      throw error;
    }
  },

  /**
   * Effectuer un achat (transaction simulée)
   */
  purchaseListing: async (purchaseData: PurchaseRequest): Promise<MarketplacePurchase> => {
    try {
      const response = await apiClient.post('/marketplace/purchase', purchaseData);
      return extractApiData<MarketplacePurchase>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données d\'achat invalides. Vérifiez tous les champs requis.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 402) {
        throw new Error('Problème de paiement. Vérifiez vos informations de paiement.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (error.response?.status === 409) {
        throw new Error('L\'article n\'est plus disponible ou la quantité demandée excède le stock disponible.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to purchase listing:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une annonce
   */
  updateListing: async (listingId: string, listingData: Partial<{
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    tags: string[];
    availableQuantity: number;
  }>): Promise<MarketplaceListing> => {
    try {
      const response = await apiClient.put(`/marketplace/${listingId}`, listingData);
      return extractApiData<MarketplaceListing>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données d\'annonce invalides.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour modifier cette annonce.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to update listing ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Changer le statut d'une annonce
   */
  changeListingStatus: async (listingId: string, status: 'ACTIVE' | 'SOLD' | 'PAUSED' | 'ARCHIVED'): Promise<MarketplaceListing> => {
    try {
      const response = await apiClient.patch(`/marketplace/${listingId}/status`, { status });
      return extractApiData<MarketplaceListing>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Statut d\'annonce invalide.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour modifier cette annonce.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to change status of listing ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer une annonce
   */
  deleteListing: async (listingId: string): Promise<void> => {
    try {
      await apiClient.delete(`/marketplace/${listingId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour supprimer cette annonce.');
      } else if (error.response?.status === 404) {
        throw new Error('Annonce introuvable.');
      } else if (error.response?.status === 409) {
        throw new Error('Impossible de supprimer cette annonce car elle a des achats associés.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to delete listing ${listingId}:`, error);
      throw error;
    }
  }
};

export default marketplaceApi;