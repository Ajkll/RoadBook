import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation.middleware';
import * as communityController from '../../controllers/community.controller';

const router = Router();

// Validation schemas
const postSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
    content: z.string().min(1, 'Content cannot be empty').max(5000, 'Content must be less than 5000 characters'),
    mediaUrls: z.array(z.string().url('Invalid URL')).optional(),
  }),
});

const commentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
  }),
});

const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
    content: z.string().min(1, 'Content cannot be empty').max(5000, 'Content must be less than 5000 characters').optional(),
    mediaUrls: z.array(z.string().url('Invalid URL')).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
    path: [],
  }),
});

// Posts routes
router.get('/', communityController.getPosts);
router.get('/search', communityController.searchPosts);
router.post('/', authenticate, validateRequest(postSchema), communityController.createPost);
router.get('/users/:userId', communityController.getPostsByUser);
router.get('/:postId', communityController.getPostById);
router.put('/:postId', authenticate, validateRequest(updatePostSchema), communityController.updatePost);
router.delete('/:postId', authenticate, communityController.deletePost);

// Comments routes
router.post('/:postId/comments', authenticate, validateRequest(commentSchema), communityController.addComment);
router.delete('/comments/:commentId', authenticate, communityController.deleteComment);

// Likes routes
router.post('/:postId/likes', authenticate, communityController.likePost);
router.delete('/:postId/likes', authenticate, communityController.unlikePost);
router.get('/:postId/likes', communityController.getPostLikes);
router.get('/:postId/likes/check', authenticate, communityController.hasUserLikedPost);

export default router;