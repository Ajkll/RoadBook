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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const communityController = __importStar(require("../../controllers/community.controller"));
const router = (0, express_1.Router)();
// Validation schemas
const postSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
        content: zod_1.z.string().min(1, 'Content cannot be empty').max(5000, 'Content must be less than 5000 characters'),
        mediaUrls: zod_1.z.array(zod_1.z.string().url('Invalid URL')).optional(),
    }),
});
const commentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
    }),
});
const updatePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
        content: zod_1.z.string().min(1, 'Content cannot be empty').max(5000, 'Content must be less than 5000 characters').optional(),
        mediaUrls: zod_1.z.array(zod_1.z.string().url('Invalid URL')).optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
        path: [],
    }),
});
// Posts routes
router.get('/', communityController.getPosts);
router.get('/search', communityController.searchPosts);
router.post('/', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(postSchema), communityController.createPost);
router.get('/users/:userId', communityController.getPostsByUser);
router.get('/:postId', communityController.getPostById);
router.put('/:postId', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(updatePostSchema), communityController.updatePost);
router.delete('/:postId', auth_middleware_1.authenticate, communityController.deletePost);
// Comments routes
router.post('/:postId/comments', auth_middleware_1.authenticate, (0, validation_middleware_1.validateRequest)(commentSchema), communityController.addComment);
router.delete('/comments/:commentId', auth_middleware_1.authenticate, communityController.deleteComment);
// Likes routes
router.post('/:postId/likes', auth_middleware_1.authenticate, communityController.likePost);
router.delete('/:postId/likes', auth_middleware_1.authenticate, communityController.unlikePost);
router.get('/:postId/likes', communityController.getPostLikes);
router.get('/:postId/likes/check', auth_middleware_1.authenticate, communityController.hasUserLikedPost);
exports.default = router;
