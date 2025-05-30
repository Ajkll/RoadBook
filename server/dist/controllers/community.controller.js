"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPosts = exports.getPostsByUser = exports.hasUserLikedPost = exports.getPostLikes = exports.unlikePost = exports.likePost = exports.deleteComment = exports.addComment = exports.deletePost = exports.updatePost = exports.createPost = exports.getPostById = exports.getPosts = void 0;
const communityService = __importStar(require("../services/community.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Get all posts with pagination
 */
const getPosts = async (req, res) => {
    var _a;
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = await communityService.getPosts({ page, limit, sort, order }, userId);
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error getting posts: ${error.message}`);
        return res.status(500).json({ message: 'Failed to retrieve posts' });
    }
};
exports.getPosts = getPosts;
/**
 * Get a single post by ID
 */
const getPostById = async (req, res) => {
    var _a;
    try {
        const { postId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const post = await communityService.getPostById(postId, userId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        return res.status(200).json(post);
    }
    catch (error) {
        if (error.message === 'You do not have permission to view this post') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error getting post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to retrieve post' });
    }
};
exports.getPostById = getPostById;
/**
 * Create a new post
 */
const createPost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { title, content, mediaUrls } = req.body;
        // Validate required fields
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const post = await communityService.createPost(req.user.id, { title, content, mediaUrls });
        return res.status(201).json(post);
    }
    catch (error) {
        if (error.message.includes('Rate limit exceeded')) {
            return res.status(429).json({ message: error.message });
        }
        logger_1.default.error(`Error creating post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to create post' });
    }
};
exports.createPost = createPost;
/**
 * Update an existing post
 */
const updatePost = async (req, res) => {
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
        const post = await communityService.updatePost(postId, req.user.id, { title, content, mediaUrls });
        return res.status(200).json(post);
    }
    catch (error) {
        if (error.message === 'Post not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'You do not have permission to update this post') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error updating post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to update post' });
    }
};
exports.updatePost = updatePost;
/**
 * Delete a post
 */
const deletePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { postId } = req.params;
        await communityService.deletePost(postId, req.user.id);
        return res.status(200).json({ message: 'Post deleted successfully' });
    }
    catch (error) {
        if (error.message === 'Post not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'You do not have permission to delete this post') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error deleting post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to delete post' });
    }
};
exports.deletePost = deletePost;
/**
 * Add a comment to a post
 */
const addComment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { postId } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }
        const comment = await communityService.addComment(postId, req.user.id, content);
        return res.status(201).json(comment);
    }
    catch (error) {
        if (error.message.includes('Rate limit exceeded')) {
            return res.status(429).json({ message: error.message });
        }
        if (error.message === 'You do not have permission to comment on this post') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error adding comment: ${error.message}`);
        return res.status(500).json({ message: 'Failed to add comment' });
    }
};
exports.addComment = addComment;
/**
 * Delete a comment
 */
const deleteComment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { commentId } = req.params;
        await communityService.deleteComment(commentId, req.user.id);
        return res.status(200).json({ message: 'Comment deleted successfully' });
    }
    catch (error) {
        if (error.message === 'Comment not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'You do not have permission to delete this comment') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error deleting comment: ${error.message}`);
        return res.status(500).json({ message: 'Failed to delete comment' });
    }
};
exports.deleteComment = deleteComment;
/**
 * Like a post
 */
const likePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { postId } = req.params;
        const like = await communityService.likePost(postId, req.user.id);
        return res.status(201).json(like);
    }
    catch (error) {
        if (error.message.includes('Rate limit exceeded')) {
            return res.status(429).json({ message: error.message });
        }
        if (error.message === 'You have already liked this post') {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'You do not have permission to like this post') {
            return res.status(403).json({ message: error.message });
        }
        logger_1.default.error(`Error liking post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to like post' });
    }
};
exports.likePost = likePost;
/**
 * Unlike a post
 */
const unlikePost = async (req, res) => {
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
    }
    catch (error) {
        logger_1.default.error(`Error unliking post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to unlike post' });
    }
};
exports.unlikePost = unlikePost;
/**
 * Get users who liked a post
 */
const getPostLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const result = await communityService.getPostLikes(postId, { page, limit });
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error getting post likes: ${error.message}`);
        return res.status(500).json({ message: 'Failed to retrieve post likes' });
    }
};
exports.getPostLikes = getPostLikes;
/**
 * Check if user has liked a post
 */
const hasUserLikedPost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { postId } = req.params;
        const hasLiked = await communityService.hasUserLikedPost(postId, req.user.id);
        return res.status(200).json({ hasLiked });
    }
    catch (error) {
        logger_1.default.error(`Error checking if user liked post: ${error.message}`);
        return res.status(500).json({ message: 'Failed to check like status' });
    }
};
exports.hasUserLikedPost = hasUserLikedPost;
/**
 * Get posts by a specific user
 */
const getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';
        const result = await communityService.getPostsByUser(userId, { page, limit, sort, order });
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error getting posts by user: ${error.message}`);
        return res.status(500).json({ message: 'Failed to retrieve user posts' });
    }
};
exports.getPostsByUser = getPostsByUser;
/**
 * Search posts
 */
const searchPosts = async (req, res) => {
    var _a;
    try {
        const { q } = req.query;
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';
        if (!q || typeof q !== 'string' || q.trim().length < 2) {
            return res.status(400).json({
                message: 'Search query must be at least 2 characters'
            });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = await communityService.searchPosts(q, { page, limit, sort, order }, userId);
        return res.status(200).json(result);
    }
    catch (error) {
        logger_1.default.error(`Error searching posts: ${error.message}`);
        return res.status(500).json({ message: 'Failed to search posts' });
    }
};
exports.searchPosts = searchPosts;
