/**
 * SESSION CONTROLLER
 * 
 * Ce contrôleur gère les routes liées aux sessions de conduite:
 * - Création d'une nouvelle session
 * - Récupération des détails d'une session
 * - Mise à jour des informations d'une session
 * - Validation d'une session par un guide/instructeur
 * - Suppression d'une session
 * - Ajout de commentaires à une session
 * 
 * Les contrôleurs sont responsables de:
 * - Traiter les requêtes HTTP
 * - Valider les permissions et autorisations
 * - Appeler les services appropriés
 * - Formater et renvoyer les réponses de manière cohérente
 * - Gestion des erreurs
 */

import { Request, Response } from "express";
import * as sessionService from "../services/session.service";
import logger from "../utils/logger";

/**
 * Get session by ID - Récupérer les détails d'une session spécifique
 * 
 * @route GET /api/sessions/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Vérifier si l'utilisateur a accès à cette session
    const hasAccess = await sessionService.checkSessionAccess(id, req.user.userId);
    if (!hasAccess) {
      return res.status(403).json({
        status: "error",
        message: "You don't have permission to view this session"
      });
    }
    
    // Récupérer les détails de la session
    const session = await sessionService.getSessionById(id);
    
    // Calculer des statistiques additionnelles pour la session
    const statistics = await sessionService.calculateSessionStatistics(id);
    
    return res.status(200).json({
      status: "success",
      data: {
        ...session,
        statistics
      }
    });
  } catch (error: any) {
    logger.error(`Error getting session ${req.params.id}: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get session details",
      details: error.message
    });
  }
};

/**
 * Create session - Créer une nouvelle session de conduite
 * 
 * @route POST /api/roadbooks/:roadbookId/sessions
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const { roadbookId } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Construire les données de la session
    const sessionData = {
      roadbookId,
      apprenticeId: req.body.apprenticeId || req.user.userId, // Défaut à l'utilisateur courant
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      duration: req.body.duration,
      startLocation: req.body.startLocation,
      endLocation: req.body.endLocation,
      distance: req.body.distance,
      routeData: req.body.routeData,
      weather: req.body.weather,
      daylight: req.body.daylight,
      roadTypes: req.body.roadTypes,
      notes: req.body.notes,
      validatorId: req.body.validatorId,
      validationDate: req.body.validationDate
    };
    
    // Créer la session
    const session = await sessionService.createSession(sessionData);
    
    return res.status(201).json({
      status: "success",
      message: "Session created successfully",
      data: session
    });
  } catch (error: any) {
    logger.error(`Error creating session: ${error.message}`);
    
    if (error.message === "Roadbook not found") {
      return res.status(404).json({
        status: "error",
        message: "Roadbook not found"
      });
    }
    
    if (error.message === "Apprentice not found" || error.message === "Validator not found") {
      return res.status(404).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to create session",
      details: error.message
    });
  }
};

/**
 * Update session - Mettre à jour une session existante
 * 
 * @route PUT /api/sessions/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Construire les données de mise à jour
    const updateData = {
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      duration: req.body.duration,
      startLocation: req.body.startLocation,
      endLocation: req.body.endLocation,
      distance: req.body.distance,
      routeData: req.body.routeData,
      weather: req.body.weather,
      daylight: req.body.daylight,
      roadTypes: req.body.roadTypes,
      notes: req.body.notes
    };
    
    // Mettre à jour la session
    const updatedSession = await sessionService.updateSession(id, updateData, req.user.userId);
    
    return res.status(200).json({
      status: "success",
      message: "Session updated successfully",
      data: updatedSession
    });
  } catch (error: any) {
    logger.error(`Error updating session ${req.params.id}: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message === "Cannot update a validated session") {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to update session",
      details: error.message
    });
  }
};

/**
 * Validate session - Valider une session par un guide/instructeur
 * 
 * @route POST /api/sessions/:id/validate
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const validateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { notes } = req.body;
    
    // Valider la session
    const validatedSession = await sessionService.validateSession(id, req.user.userId, notes);
    
    return res.status(200).json({
      status: "success",
      message: "Session validated successfully",
      data: validatedSession
    });
  } catch (error: any) {
    logger.error(`Error validating session ${req.params.id}: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    if (error.message === "Validator not found") {
      return res.status(404).json({
        status: "error",
        message: "Validator not found"
      });
    }
    
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message === "Session is already validated") {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to validate session",
      details: error.message
    });
  }
};

/**
 * Delete session - Supprimer une session
 * 
 * @route DELETE /api/sessions/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Supprimer la session
    await sessionService.deleteSession(id, req.user.userId);
    
    return res.status(200).json({
      status: "success",
      message: "Session deleted successfully"
    });
  } catch (error: any) {
    logger.error(`Error deleting session ${req.params.id}: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message === "Cannot delete a validated session") {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to delete session",
      details: error.message
    });
  }
};

/**
 * Get sessions by apprentice - Récupérer les sessions d'un apprenti
 * 
 * @route GET /api/users/:userId/sessions
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getSessionsByApprentice = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Vérifier les autorisations (un utilisateur peut voir ses propres sessions, les instructeurs peuvent voir celles de leurs apprentis)
    if (req.user.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
      return res.status(403).json({
        status: "error",
        message: "You don't have permission to view these sessions"
      });
    }
    
    // Récupérer les sessions
    const result = await sessionService.getSessionsByApprentice(userId, limit, offset);
    
    return res.status(200).json({
      status: "success",
      data: result.sessions,
      pagination: result.pagination
    });
  } catch (error: any) {
    logger.error(`Error getting sessions for user ${req.params.userId}: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get sessions",
      details: error.message
    });
  }
};

/**
 * Add comment to session - Ajouter un commentaire à une session
 * 
 * @route POST /api/sessions/:id/comments
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const addSessionComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: "error",
        message: "Comment content is required"
      });
    }
    
    // Ajouter le commentaire
    const comment = await sessionService.addSessionComment(id, req.user.userId, content);
    
    return res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: comment
    });
  } catch (error: any) {
    logger.error(`Error adding comment to session ${req.params.id}: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to add comment",
      details: error.message
    });
  }
};