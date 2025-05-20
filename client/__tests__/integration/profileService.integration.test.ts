import axios from 'axios';
import { User, UserRole } from '../../app/types/auth.types';

// Mock axios
jest.mock('axios');

// Mock logger
jest.mock('../../app/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }
}));

// Mock ApiClient
jest.mock('../../app/services/api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
  }
}));

describe('Profile Service - Integration Tests', () => {
  let usersApi;
  let apiClient;
  let mockUser: User;
  let mockFormData: FormData;

  beforeEach(() => {
    jest.clearAllMocks();

    // Récupérer les mocks
    apiClient = require('../../app/services/api/client').default;
    
    // Mock User
    mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      role: UserRole.APPRENTICE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock FormData
    mockFormData = new FormData();
    mockFormData.append('avatar', {
      uri: 'file:///path/to/image.jpg',
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    // Mock du extractApiData pour simplifier
    const utils = require('../../app/services/api/utils');
    utils.extractApiData = jest.fn(response => response.data);

    // Importer après les mocks
    usersApi = require('../../app/services/api/users.api').usersApi;
  });

  describe('updateProfileAvatar', () => {
    it('should successfully update profile avatar', async () => {
      const mockResponse = {
        data: {
          profilePicture: 'https://example.com/avatar.jpg'
        }
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await usersApi.updateProfileAvatar(mockFormData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/users/me/avatar',
        mockFormData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          })
        })
      );
      expect(result).toEqual({ profilePicture: 'https://example.com/avatar.jpg' });
    });

    it('should handle API error correctly', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: {
          status: 413,
          data: {
            message: 'L\'image est trop volumineuse.'
          }
        }
      });

      await expect(usersApi.updateProfileAvatar(mockFormData)).rejects.toThrow(
        'L\'image est trop volumineuse. Veuillez utiliser une image de moins de 5 Mo.'
      );
    });

    it('should handle connection error correctly', async () => {
      apiClient.post.mockRejectedValueOnce({
        message: 'Network Error'
      });

      await expect(usersApi.updateProfileAvatar(mockFormData)).rejects.toThrow(
        'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
      );
    });
  });

  describe('updateProfile (with profile picture)', () => {
    it('should update profile data successfully', async () => {
      const mockResponse = {
        data: {
          ...mockUser,
          profilePicture: 'https://example.com/avatar.jpg'
        }
      };

      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await usersApi.updateProfile({ 
        profilePicture: 'https://example.com/avatar.jpg' 
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({ 
          profilePicture: 'https://example.com/avatar.jpg' 
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});