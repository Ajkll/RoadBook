/**
 * COMPETENCY CONTROLLER
 * 
 * Ce contrôleur gère les routes liées aux compétences de conduite:
 * - Récupération des compétences disponibles
 * - Gestion de la progression des apprentis
 * - Validation des compétences par les guides/instructeurs
 * - Récupération de statistiques de progression
 * 
 * Le système de compétences est au cœur de l'apprentissage,
 * permettant de suivre précisément les acquis et l'évolution
 * de chaque apprenti dans son parcours de formation.
 */

import { Request, Response } from "express";
import * as competencyService from "../services/competency.service";
import logger from "../utils/logger";

/**
 * Get all competencies - Récupérer toutes les compétences disponibles
 * 
 * @route GET /api/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getAllCompetencies = async (req: Request, res: Response) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Extraire les filtres optionnels
    const { phase, category } = req.query;
    
    logger.info(`Retrieving competencies with filters: phase=${phase}, category=${category}`);
    
    // Récupérer les compétences avec filtrage éventuel
    const competencies = await competencyService.getAllCompetencies(
      phase as competencyService.LearningPhase,
      category as competencyService.CompetencyCategory
    );
    
    return res.status(200).json({
      status: "success",
      count: competencies.length,
      data: competencies
    });
  } catch (error: any) {
    logger.error(`Error getting competencies: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve competencies",
      details: error.message
    });
  }
};

/**
 * Get competency by ID - Récupérer une compétence spécifique
 * 
 * @route GET /api/competencies/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getCompetencyById = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { id } = req.params;
    
    // Récupérer la compétence
    const competency = await competencyService.getCompetencyById(id);
    
    return res.status(200).json({
      status: "success",
      data: competency
    });
  } catch (error: any) {
    logger.error(`Error getting competency ${req.params.id}: ${error.message}`);
    
    if (error.message === "Competency not found") {
      return res.status(404).json({
        status: "error",
        message: "Competency not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve competency",
      details: error.message
    });
  }
};

/**
 * Get competency progress for roadbook - Récupérer la progression des compétences d'un roadbook
 * 
 * @route GET /api/roadbooks/:roadbookId/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getCompetencyProgressForRoadbook = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { roadbookId } = req.params;
    
    // Récupérer la progression des compétences
    const progress = await competencyService.getCompetencyProgressForRoadbook(roadbookId);
    
    return res.status(200).json({
      status: "success",
      data: progress
    });
  } catch (error: any) {
    logger.error(`Error getting competency progress for roadbook ${req.params.roadbookId}: ${error.message}`);
    
    if (error.message === "Roadbook not found") {
      return res.status(404).json({
        status: "error",
        message: "Roadbook not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve competency progress",
      details: error.message
    });
  }
};

/**
 * Update competency status - Mettre à jour le statut d'une compétence
 * 
 * @route PUT /api/roadbooks/:roadbookId/competencies/:competencyId
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const updateCompetencyStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { roadbookId, competencyId } = req.params;
    const { status, notes } = req.body;
    
    logger.info(`Updating competency ${competencyId} status to ${status} for roadbook ${roadbookId}`);
    
    // Mettre à jour le statut de la compétence
    const updatedProgress = await competencyService.updateCompetencyStatus(
      roadbookId,
      competencyId,
      status,
      notes,
      req.user.userId
    );
    
    return res.status(200).json({
      status: "success",
      message: "Competency status updated successfully",
      data: updatedProgress
    });
  } catch (error: any) {
    logger.error(`Error updating competency status: ${error.message}`);
    
    if (error.message === "Roadbook not found" || error.message === "Competency not found") {
      return res.status(404).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message === "Unauthorized to update competency status") {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    if (error.message.includes("Invalid status")) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to update competency status",
      details: error.message
    });
  }
};

/**
 * Validate competencies - Valider des compétences dans une session
 * 
 * @route POST /api/sessions/:sessionId/competencies/validate
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const validateCompetencies = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { sessionId } = req.params;
    const validations = req.body.validations;
    
    if (!validations || !Array.isArray(validations) || validations.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Validations array is required"
      });
    }
    
    logger.info(`Validating ${validations.length} competencies for session ${sessionId}`);
    
    // Valider les compétences
    const results = await competencyService.validateCompetencies(
      sessionId,
      validations,
      req.user.userId
    );
    
    // Compter les succès et échecs
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return res.status(200).json({
      status: "success",
      message: `Validated ${successCount} competencies successfully, ${failureCount} failed`,
      data: results
    });
  } catch (error: any) {
    logger.error(`Error validating competencies: ${error.message}`);
    
    if (error.message === "Session not found") {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }
    
    if (error.message === "Unauthorized to validate competencies") {
      return res.status(403).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to validate competencies",
      details: error.message
    });
  }
};

/**
 * Get competency validations for session - Récupérer les validations de compétences d'une session
 * 
 * @route GET /api/sessions/:sessionId/competencies
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getCompetencyValidationsForSession = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { sessionId } = req.params;
    
    // Récupérer les validations
    const validations = await competencyService.getCompetencyValidationsForSession(sessionId);
    
    return res.status(200).json({
      status: "success",
      count: validations.length,
      data: validations
    });
  } catch (error: any) {
    logger.error(`Error getting competency validations for session ${req.params.sessionId}: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve competency validations",
      details: error.message
    });
  }
};

/**
 * Get learning phase - Récupérer les détails d'une phase d'apprentissage
 * 
 * @route GET /api/competencies/phases/:phase
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getLearningPhase = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { phase } = req.params;
    
    // Vérifier si la phase est valide
    if (!Object.values(competencyService.LearningPhase).includes(phase as competencyService.LearningPhase)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid learning phase",
        validPhases: Object.values(competencyService.LearningPhase)
      });
    }
    
    // Récupérer les détails de la phase
    const phaseDetails = await competencyService.getLearningPhase(phase as competencyService.LearningPhase);
    
    return res.status(200).json({
      status: "success",
      data: phaseDetails
    });
  } catch (error: any) {
    logger.error(`Error getting learning phase ${req.params.phase}: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve learning phase",
      details: error.message
    });
  }
};

/**
 * Get competency progress detail - Récupérer les détails de progression d'une compétence
 * 
 * @route GET /api/roadbooks/:roadbookId/competencies/:competencyId/detail
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getCompetencyProgressDetail = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { roadbookId, competencyId } = req.params;
    
    // Récupérer les détails de progression
    const progressDetail = await competencyService.getCompetencyProgressDetail(roadbookId, competencyId);
    
    return res.status(200).json({
      status: "success",
      data: progressDetail
    });
  } catch (error: any) {
    logger.error(`Error getting competency progress detail: ${error.message}`);
    
    if (error.message === "Roadbook not found" || error.message === "Competency not found") {
      return res.status(404).json({
        status: "error",
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve competency progress detail",
      details: error.message
    });
  }
};

/**
 * Get apprentice competency stats - Récupérer les statistiques de compétences d'un apprenti
 * 
 * @route GET /api/apprentices/:apprenticeId/competencies/stats
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getApprenticeCompetencyStats = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { apprenticeId } = req.params;
    
    // Vérifier les permissions (s'il ne s'agit pas de l'apprenti lui-même)
    if (apprenticeId !== req.user.userId && req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized to access these statistics"
      });
    }
    
    // Récupérer les statistiques
    const stats = await competencyService.getApprenticeCompetencyStats(apprenticeId);
    
    return res.status(200).json({
      status: "success",
      data: stats
    });
  } catch (error: any) {
    logger.error(`Error getting apprentice competency stats: ${error.message}`);
    
    if (error.message === "Apprentice not found") {
      return res.status(404).json({
        status: "error",
        message: "Apprentice not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to retrieve apprentice competency statistics",
      details: error.message
    });
  }
};