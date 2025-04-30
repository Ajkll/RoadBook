import { Request, Response } from 'express';
import * as communityService from '../services/community.service';
import logger from '../utils/logger';

/**
 * Get all posts with pagination
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    
    const userId = req.user?.id;
    
    const result = await communityService.getPosts(
      { page, limit, sort, order },
      userId
    );
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error getting posts: ${error.message}`);
    return res.status(500).json({ message: 'Failed to retrieve posts' });
  }
};

/**
 * Get a single post by ID
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    const post = await communityService.getPostById(postId, userId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    return res.status(200).json(post);
  } catch (error: any) {
    if (error.message === 'You do not have permission to view this post') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error getting post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to retrieve post' });
  }
};

/**
 * Create a new post
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { title, content, mediaUrls } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const post = await communityService.createPost(
      req.user.id,
      { title, content, mediaUrls }
    );
    
    return res.status(201).json(post);
  } catch (error: any) {
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ message: error.message });
    }
    
    logger.error(`Error creating post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

/**
 * Update an existing post
 */
export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    const { title, content, mediaUrls } = req.body;
    
    // Ensure at least one field to update
    if (!title && !content && !mediaUrls) {
      return res.status(400).json({ message: 'No update fields provided' });
    }
    
    const post = await communityService.updatePost(
      postId,
      req.user.id,
      { title, content, mediaUrls }
    );
    
    return res.status(200).json(post);
  } catch (error: any) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === 'You do not have permission to update this post') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error updating post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to update post' });
  }
};

/**
 * Delete a post
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    
    await communityService.deletePost(postId, req.user.id);
    
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === 'You do not have permission to delete this post') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error deleting post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const comment = await communityService.addComment(
      postId,
      req.user.id,
      content
    );
    
    return res.status(201).json(comment);
  } catch (error: any) {
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ message: error.message });
    }
    
    if (error.message === 'You do not have permission to comment on this post') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error adding comment: ${error.message}`);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { commentId } = req.params;
    
    await communityService.deleteComment(commentId, req.user.id);
    
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Comment not found') {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message === 'You do not have permission to delete this comment') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error deleting comment: ${error.message}`);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

/**
 * Like a post
 */
export const likePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    
    const like = await communityService.likePost(postId, req.user.id);
    
    return res.status(201).json(like);
  } catch (error: any) {
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ message: error.message });
    }
    
    if (error.message === 'You have already liked this post') {
      return res.status(409).json({ message: error.message });
    }
    
    if (error.message === 'You do not have permission to like this post') {
      return res.status(403).json({ message: error.message });
    }
    
    logger.error(`Error liking post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to like post' });
  }
};

/**
 * Unlike a post
 */
export const unlikePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    
    const result = await communityService.unlikePost(postId, req.user.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Like not found' });
    }
    
    return res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error: any) {
    logger.error(`Error unliking post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to unlike post' });
  }
};

/**
 * Get users who liked a post
 */
export const getPostLikes = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await communityService.getPostLikes(
      postId,
      { page, limit }
    );
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error getting post likes: ${error.message}`);
    return res.status(500).json({ message: 'Failed to retrieve post likes' });
  }
};

/**
 * Check if user has liked a post
 */
export const hasUserLikedPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { postId } = req.params;
    
    const hasLiked = await communityService.hasUserLikedPost(postId, req.user.id);
    
    return res.status(200).json({ hasLiked });
  } catch (error: any) {
    logger.error(`Error checking if user liked post: ${error.message}`);
    return res.status(500).json({ message: 'Failed to check like status' });
  }
};

/**
 * Get posts by a specific user
 */
export const getPostsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    
    const result = await communityService.getPostsByUser(
      userId,
      { page, limit, sort, order }
    );
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error getting posts by user: ${error.message}`);
    return res.status(500).json({ message: 'Failed to retrieve user posts' });
  }
};

/**
 * Search posts
 */
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as 'asc' | 'desc' || 'desc';
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters' 
      });
    }
    
    const userId = req.user?.id;
    
    const result = await communityService.searchPosts(
      q,
      { page, limit, sort, order },
      userId
    );
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error searching posts: ${error.message}`);
    return res.status(500).json({ message: 'Failed to search posts' });
  }
};