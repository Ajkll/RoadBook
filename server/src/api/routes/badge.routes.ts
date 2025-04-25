import { Router } from 'express';
import * as badgeController from '../../controllers/badge.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authenticate, authorizeAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Badge schema for validation
const badgeSchema = z.object({
  name: z.string().min(3, 'Badge name must be at least 3 characters long'),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  category: z.string().min(1, 'Category is required'),
  criteria: z.string().min(1, 'Criteria is required'),
});

const awardBadgeSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  badgeId: z.string().uuid('Invalid badge ID format'),
});

// Public routes
router.get('/', badgeController.getAllBadges);
router.get('/categories/:category', badgeController.getBadgesByCategory);
router.get('/leaderboard', badgeController.getBadgeLeaderboard);
router.get('/:badgeId', badgeController.getBadgeById);

// User authenticated routes
router.get('/users/me', authenticate, badgeController.getMyBadges);
router.get('/users/:userId', authenticate, badgeController.getUserBadges);
router.post('/check', authenticate, badgeController.checkAndAwardMyBadges);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, validateRequest(badgeSchema), badgeController.createBadge);
router.put('/:badgeId', authenticate, authorizeAdmin, validateRequest(badgeSchema), badgeController.updateBadge);
router.delete('/:badgeId', authenticate, authorizeAdmin, badgeController.deleteBadge);
router.post('/award', authenticate, authorizeAdmin, validateRequest(awardBadgeSchema), badgeController.awardBadge);
router.delete('/:badgeId/users/:userId', authenticate, authorizeAdmin, badgeController.revokeBadge);

export default router;
