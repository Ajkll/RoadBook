/**
 * API Services Index
 * Exporte tous les services API pour une utilisation facile
 */

// Configuration du client et environnement
import apiClient, { API_URL, API_CONFIG, testApiConnection, authEvents } from './client';
export { apiClient, API_URL, API_CONFIG, testApiConnection, authEvents };

// Utilitaires
import * as apiUtils from './utils';
export { apiUtils };

// Services individuels
import authApi from './auth.api';
import usersApi from './users.api';
import roadbookApi from './roadbook.api';
import sessionApi from './session.api';
import badgeApi from './badge.api';
import notificationApi from './notification.api';
import weatherApi from './weather';
import privacyApi from './privacy.api';
import competenciesApi from './competencies.api';
import communityApi from './community.api';
import marketplaceApi from './marketplace.api';

// Exportations nommées pour un accès facile
export {
  authApi,
  usersApi,
  roadbookApi,
  sessionApi,
  badgeApi,
  notificationApi,
  weatherApi,
  privacyApi,
  competenciesApi,
  communityApi,
  marketplaceApi
};

// Exportation par défaut pour une utilisation dans un contexte de composant React
export default {
  auth: authApi,
  users: usersApi,
  roadbook: roadbookApi,
  session: sessionApi,
  badge: badgeApi,
  notification: notificationApi,
  weather: weatherApi,
  privacy: privacyApi,
  competencies: competenciesApi,
  community: communityApi,
  marketplace: marketplaceApi,
  config: API_CONFIG,
  testConnection: testApiConnection
};