import { Request, Response } from 'express';
import * as badgeService from '../services/badge.service';

/**
 * Get all badges
 */
export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const badges = await badgeService.getAllBadges();
    return res.status(200).json(badges);
  } catch (error) {
    console.error('Failed to get badges:', error);
    return res.status(500).json({ message: 'Failed to retrieve badges' });
  }
};

/**
 * Get a single badge by ID
 */
export const getBadgeById = async (req: Request, res: Response) => {
  try {
    const { badgeId } = req.params;
    const badge = await badgeService.getBadgeById(badgeId);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    return res.status(200).json(badge);
  } catch (error) {
    console.error('Failed to get badge:', error);
    return res.status(500).json({ message: 'Failed to retrieve badge' });
  }
};

/**
 * Get badges for a specific user
 */
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const badges = await badgeService.getUserBadges(userId);
    return res.status(200).json(badges);
  } catch (error) {
    console.error('Failed to get user badges:', error);
    return res.status(500).json({ message: 'Failed to retrieve user badges' });
  }
};

/**
 * Get the authenticated user's badges
 */
export const getMyBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const badges = await badgeService.getUserBadges(userId);
    return res.status(200).json(badges);
  } catch (error) {
    console.error('Failed to get user badges:', error);
    return res.status(500).json({ message: 'Failed to retrieve user badges' });
  }
};

/**
 * Award a badge to a user (admin only)
 */
export const awardBadge = async (req: Request, res: Response) => {
  try {
    const { userId, badgeId } = req.body;
    
    if (!userId || !badgeId) {
      return res.status(400).json({ message: 'User ID and badge ID are required' });
    }
    
    const userBadge = await badgeService.awardBadge(userId, badgeId);
    return res.status(201).json(userBadge);
  } catch (error: any) {
    console.error('Failed to award badge:', error);
    
    if (error.message === 'User already has this badge') {
      return res.status(409).json({ message: error.message });
    }
    
    return res.status(500).json({ message: 'Failed to award badge' });
  }
};

/**
 * Revoke a badge from a user (admin only)
 */
export const revokeBadge = async (req: Request, res: Response) => {
  try {
    const { userId, badgeId } = req.params;
    
    await badgeService.revokeBadge(userId, badgeId);
    return res.status(200).json({ message: 'Badge revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke badge:', error);
    return res.status(500).json({ message: 'Failed to revoke badge' });
  }
};

/**
 * Create a new badge (admin only)
 */
export const createBadge = async (req: Request, res: Response) => {
  try {
    const badgeData = req.body;
    const badge = await badgeService.createBadge(badgeData);
    return res.status(201).json(badge);
  } catch (error) {
    console.error('Failed to create badge:', error);
    return res.status(500).json({ message: 'Failed to create badge' });
  }
};

/**
 * Update a badge (admin only)
 */
export const updateBadge = async (req: Request, res: Response) => {
  try {
    const { badgeId } = req.params;
    const badgeData = req.body;
    
    const badge = await badgeService.updateBadge(badgeId, badgeData);
    return res.status(200).json(badge);
  } catch (error) {
    console.error('Failed to update badge:', error);
    return res.status(500).json({ message: 'Failed to update badge' });
  }
};

/**
 * Delete a badge (admin only)
 */
export const deleteBadge = async (req: Request, res: Response) => {
  try {
    const { badgeId } = req.params;
    
    await badgeService.deleteBadge(badgeId);
    return res.status(200).json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Failed to delete badge:', error);
    return res.status(500).json({ message: 'Failed to delete badge' });
  }
};

/**
 * Get badges by category
 */
export const getBadgesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const badges = await badgeService.getBadgesByCategory(category);
    return res.status(200).json(badges);
  } catch (error) {
    console.error('Failed to get badges by category:', error);
    return res.status(500).json({ message: 'Failed to retrieve badges' });
  }
};

/**
 * Get badge leaderboard
 */
export const getBadgeLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const leaderboard = await badgeService.getBadgeLeaderboard(limit);
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Failed to get badge leaderboard:', error);
    return res.status(500).json({ message: 'Failed to retrieve leaderboard' });
  }
};

/**
 * Check and award badges for the authenticated user
 */
export const checkAndAwardMyBadges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const awardedBadges = await badgeService.checkAndAwardBadges(userId);
    return res.status(200).json({
      message: `${awardedBadges.length} new badge(s) awarded`,
      badges: awardedBadges
    });
  } catch (error) {
    console.error('Failed to check and award badges:', error);
    return res.status(500).json({ message: 'Failed to check and award badges' });
  }
};
