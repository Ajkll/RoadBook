import { api } from './client';
import { SessionData } from '../../types/session.types';
import { logger } from '../../utils/logger';

// pour enregistrer une session
export const createSession = async (sessionData: SessionData) => {
  try {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  } catch (error) {
    logger.error('Erreur lors de la création de session:', error);
    throw error;
  }
};

// pour mettre à jour une session
export const updateSession = async (sessionId: string, sessionData: SessionData) => {
  try {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  } catch (error) {
    logger.error('Erreur lors de la maj de session:', error);
    throw error;
  }
};
