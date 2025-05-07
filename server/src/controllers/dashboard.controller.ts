/**
 * DASHBOARD CONTROLLER
 * 
 * Ce contrôleur gère les routes liées au tableau de bord:
 * - Récupération des statistiques globales d'un utilisateur
 * - Récupération du résumé d'activité récente
 * - Récupération des statistiques de progression
 * 
 * Le tableau de bord présente une vue consolidée des différentes
 * activités et métriques pour permettre aux utilisateurs de suivre
 * leur progression de manière efficace.
 */

import { Request, Response } from "express";
import * as statistics from "../utils/statistics";
import { prisma } from "../config/prisma";
import logger from "../utils/logger";

/**
 * Get user dashboard - Récupérer le tableau de bord d'un utilisateur
 * 
 * @route GET /api/dashboard/me
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getCurrentUserDashboard = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    logger.debug(`Getting dashboard for user: ${req.user.id}`);
    
    // Récupérer les statistiques de l'apprenti si c'est un apprenti
    let apprenticeStats = null;
    if (req.user.role === 'APPRENTICE') {
      apprenticeStats = await statistics.calculateApprenticeStatistics(req.user.id);
    }
    
    // Récupérer les roadbooks de l'utilisateur
    const roadbooks = await prisma.roadBook.findMany({
      where: { 
        OR: [
          { apprenticeId: req.user.id },
          { guideId: req.user.id }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        apprentice: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true
          }
        },
        guide: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true
          }
        },
        _count: {
          select: {
            sessions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5 // Limiter aux 5 plus récents
    });
    
    // Récupérer les sessions récentes de l'utilisateur
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { apprenticeId: req.user.id },
          { validatorId: req.user.id }
        ]
      },
      select: {
        id: true,
        date: true,
        duration: true,
        distance: true,
        startLocation: true,
        endLocation: true,
        validatorId: true,
        validationDate: true,
        roadbook: {
          select: {
            id: true,
            title: true
          }
        },
        apprentice: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10 // Limiter aux 10 plus récentes
    });
    
    // Si c'est un guide, récupérer les sessions en attente de validation
    let pendingValidations = [];
    if (['GUIDE', 'INSTRUCTOR', 'ADMIN'].includes(req.user.role || '')) {
      pendingValidations = await prisma.session.findMany({
        where: {
          roadbook: {
            guideId: req.user.id
          },
          validatorId: null // Sessions non validées
        },
        select: {
          id: true,
          date: true,
          duration: true,
          distance: true,
          roadbook: {
            select: {
              id: true,
              title: true
            }
          },
          apprentice: {
            select: {
              id: true,
              displayName: true,
              profilePicture: true
            }
          }
        },
        orderBy: { date: 'desc' },
        take: 5
      });
    }
    
    // Récupérer les notifications non lues
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    // Construire la réponse
    const dashboardData = {
      apprenticeStats,
      recentRoadbooks: roadbooks,
      recentSessions: sessions,
      pendingValidations,
      notifications,
      // Ajouter des statistiques supplémentaires selon le rôle
      stats: {
        totalRoadbooks: roadbooks.length,
        totalSessions: sessions.length,
        pendingValidationsCount: pendingValidations.length,
        notificationsCount: notifications.length
      }
    };
    
    return res.status(200).json({
      status: "success",
      data: dashboardData
    });
  } catch (error: any) {
    logger.error(`Error getting dashboard: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get dashboard data",
      details: error.message
    });
  }
};

/**
 * Get apprentice statistics - Récupérer les statistiques détaillées d'un apprenti
 * 
 * @route GET /api/dashboard/apprentice/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getApprenticeStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { id } = req.params;
    
    // Vérifier les permissions
    if (id !== req.user.id && !['GUIDE', 'INSTRUCTOR', 'ADMIN'].includes(req.user.role || '')) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view these statistics"
      });
    }
    
    // Si c'est un guide, vérifier qu'il est bien le guide de cet apprenti
    if (req.user.role === 'GUIDE') {
      const hasAccess = await prisma.roadBook.findFirst({
        where: {
          apprenticeId: id,
          guideId: req.user.id
        }
      });
      
      if (!hasAccess) {
        return res.status(403).json({
          status: "error",
          message: "Not authorized to view this apprentice's statistics"
        });
      }
    }
    
    logger.debug(`Getting statistics for apprentice: ${id}`);
    
    // Calculer les statistiques de l'apprenti
    const apprenticeStats = await statistics.calculateApprenticeStatistics(id);
    
    return res.status(200).json({
      status: "success",
      data: apprenticeStats
    });
  } catch (error: any) {
    logger.error(`Error getting apprentice statistics: ${error.message}`);
    
    if (error.message === 'Apprentice not found') {
      return res.status(404).json({
        status: "error",
        message: "Apprentice not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get apprentice statistics",
      details: error.message
    });
  }
};

/**
 * Get roadbook statistics - Récupérer les statistiques détaillées d'un roadbook
 * 
 * @route GET /api/dashboard/roadbook/:id
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getRoadbookStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    const { id } = req.params;
    
    // Vérifier les permissions
    const roadbook = await prisma.roadBook.findUnique({
      where: { id },
      select: {
        apprenticeId: true,
        guideId: true
      }
    });
    
    if (!roadbook) {
      return res.status(404).json({
        status: "error",
        message: "Roadbook not found"
      });
    }
    
    // Vérifier que l'utilisateur a accès à ce roadbook
    const hasAccess = roadbook.apprenticeId === req.user.id || 
                      roadbook.guideId === req.user.id || 
                      req.user.role === 'ADMIN' ||
                      req.user.role === 'INSTRUCTOR';
    
    if (!hasAccess) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view these statistics"
      });
    }
    
    logger.debug(`Getting statistics for roadbook: ${id}`);
    
    // Calculer les statistiques du roadbook
    const roadbookStats = await statistics.calculateRoadbookStatistics(id);
    
    return res.status(200).json({
      status: "success",
      data: roadbookStats
    });
  } catch (error: any) {
    logger.error(`Error getting roadbook statistics: ${error.message}`);
    
    if (error.message === 'Roadbook not found') {
      return res.status(404).json({
        status: "error",
        message: "Roadbook not found"
      });
    }
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get roadbook statistics",
      details: error.message
    });
  }
};

/**
 * Get recent activity - Récupérer l'activité récente pour l'utilisateur
 * 
 * @route GET /api/dashboard/activity
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated"
      });
    }
    
    // Extraire les paramètres de pagination
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    
    logger.debug(`Getting recent activity for user: ${req.user.id}, limit: ${limit}, offset: ${offset}`);
    
    // Récupérer les sessions récentes
    const recentSessions = await prisma.session.findMany({
      where: {
        OR: [
          { apprenticeId: req.user.id },
          { validatorId: req.user.id }
        ]
      },
      select: {
        id: true,
        date: true,
        duration: true,
        distance: true,
        roadbookId: true,
        apprenticeId: true,
        validatorId: true,
        validationDate: true,
        // createdAt et updatedAt n'existent pas dans le schema de Session
        apprentice: {
          select: { displayName: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset
    });
    
    // Récupérer les commentaires récents
    const recentComments = await prisma.comment.findMany({
      where: {
        OR: [
          { authorId: req.user.id },
          {
            session: {
              OR: [
                { apprenticeId: req.user.id },
                { validatorId: req.user.id }
              ]
            }
          }
        ]
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        authorId: true,
        author: {
          select: { displayName: true }
        },
        sessionId: true,
        session: {
          select: { date: true, roadbookId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    
    // Récupérer les validations récentes (si l'utilisateur est guide/instructeur)
    let recentValidations = [];
    if (['GUIDE', 'INSTRUCTOR', 'ADMIN'].includes(req.user.role || '')) {
      recentValidations = await prisma.session.findMany({
        where: { validatorId: req.user.id },
        select: {
          id: true,
          date: true,
          validationDate: true,
          apprenticeId: true,
          apprentice: {
            select: { displayName: true }
          },
          roadbookId: true
        },
        orderBy: { validationDate: 'desc' },
        take: limit,
        skip: offset
      });
    }
    
    // Fusionner et trier toutes les activités par date
    const activities = [
      ...recentSessions.map(s => ({ 
        type: 'SESSION',
        date: s.date,
        data: s,
        timestamp: new Date(s.date).getTime()
      })),
      ...recentComments.map(c => ({
        type: 'COMMENT',
        date: c.createdAt,
        data: c,
        timestamp: new Date(c.createdAt).getTime()
      })),
      ...recentValidations.map(v => ({
        type: 'VALIDATION',
        date: v.validationDate,
        data: v,
        timestamp: v.validationDate ? new Date(v.validationDate).getTime() : 0
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    
    return res.status(200).json({
      status: "success",
      data: activities,
      pagination: {
        limit,
        offset,
        hasMore: recentSessions.length === limit || recentComments.length === limit
      }
    });
  } catch (error: any) {
    logger.error(`Error getting recent activity: ${error.message}`);
    
    return res.status(500).json({
      status: "error",
      message: "Failed to get recent activity",
      details: error.message
    });
  }
};