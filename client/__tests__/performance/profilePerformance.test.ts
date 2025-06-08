import { User, UserRole } from '../../app/types/auth.types';

// Mock axios
jest.mock('axios');

// Mock apiClient
jest.mock('../../app/services/api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: { profilePicture: 'https://example.com/avatar.jpg' } }), 10)
    )),
    put: jest.fn(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: { profilePicture: 'https://example.com/avatar.jpg' } }), 5)
    )),
  },
  API_URL: 'https://mock-api.test/api',
  API_CONFIG: {
    API_URL: 'https://mock-api.test/api',
    ENVIRONMENT: 'test',
    USING_PRODUCTION: false,
    IS_PHYSICAL_DEVICE: false
  },
  authEvents: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }
}));

describe('Profile Service Performance Tests', () => {
  let usersApi;
  let mockUser: User;
  let mockFormData: FormData;

  beforeEach(() => {
    jest.clearAllMocks();

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

    // Importer après les mocks - utiliser l'import centralisé
    const api = require('../../app/services/api');
    usersApi = api.usersApi;
  });

  const measureTime = async (fn: () => Promise<any>) => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  };

  it('should update profile avatar within acceptable time (<500ms)', async () => {
    const apiClient = require('../../app/services/api/client').default;
    apiClient.post.mockImplementationOnce(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: { profilePicture: 'https://example.com/avatar.jpg' } }), 100)
    ));

    const duration = await measureTime(() => 
      usersApi.updateProfileAvatar(mockFormData)
    );

    expect(duration).toBeLessThan(500);
  });

  it('should update profile within acceptable time (<300ms)', async () => {
    const apiClient = require('../../app/services/api/client').default;
    apiClient.put.mockImplementationOnce(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: mockUser }), 50)
    ));

    const duration = await measureTime(() => 
      usersApi.updateProfile({ displayName: 'New Name' })
    );

    expect(duration).toBeLessThan(300);
  });

  it('should handle multiple concurrent profile operations efficiently', async () => {
    const apiClient = require('../../app/services/api/client').default;
    apiClient.put.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ data: mockUser }), 50)
    ));

    const operations = [
      usersApi.updateProfile({ displayName: 'Name 1' }),
      usersApi.updateProfile({ displayName: 'Name 2' }),
      usersApi.updateProfile({ displayName: 'Name 3' }),
    ];

    const start = Date.now();
    await Promise.all(operations);
    const duration = Date.now() - start;

    // Le délai pour toutes les opérations parallèles devrait être proche du délai d'une seule opération
    // et beaucoup moins que la somme des délais individuels (qui serait 150ms)
    expect(duration).toBeLessThan(300);
  });
});