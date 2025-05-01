"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userBadgeService = exports.badgeService = exports.commentService = exports.postService = exports.competencyProgressService = exports.competencyService = exports.sessionService = exports.roadbookService = exports.userService = void 0;
/**
 * Implementation of generic services for various Prisma models
 * This file creates reusable CRUD services for common models in the application
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const crud_service_1 = require("./crud.service");
const prisma_1 = __importDefault(require("../config/prisma"));
// User service with special handling for password hashing
exports.userService = (0, crud_service_1.createCrudService)('user', {
    // Fields that must be unique
    uniqueFields: ['email', 'nationalRegisterNumber'],
    // Fields to exclude from response
    excludeFromResponse: ['passwordHash'],
    // Relations to include in read operations
    includeRelations: {
        ownedRoadbooks: true,
        guidedRoadbooks: true,
        receivedBadges: {
            include: {
                badge: true
            }
        }
    },
    // Process data before creation - hash password
    beforeCreate: async (data) => {
        // Validate required fields
        if (!data.email || !data.password || !data.displayName) {
            throw new Error('Email, password and display name are required');
        }
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(data.password, saltRounds);
        // Replace password with passwordHash
        const { password, ...userData } = data;
        return {
            ...userData,
            passwordHash
        };
    },
    // Process data before update - hash password if provided
    beforeUpdate: async (id, data) => {
        const updateData = { ...data };
        // If password is provided, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.passwordHash = await bcrypt_1.default.hash(updateData.password, saltRounds);
            delete updateData.password;
        }
        return updateData;
    },
    // Access control - users can only manage their own data unless they're admins
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // For read/update/delete operations, check if the user is accessing their own data
        if (operation !== 'create') {
            return data.id === userId;
        }
        // For create operations, non-admins can only create APPRENTICE or GUIDE users
        if (['ADMIN', 'INSTRUCTOR'].includes(data.role)) {
            return false;
        }
        return true;
    }
});
// RoadBook service with access control
exports.roadbookService = (0, crud_service_1.createCrudService)('roadBook', {
    // Relations to include
    includeRelations: {
        apprentice: {
            select: {
                id: true,
                displayName: true,
                email: true,
                profilePicture: true
            }
        },
        guide: {
            select: {
                id: true,
                displayName: true,
                email: true,
                profilePicture: true
            }
        },
        sessions: {
            include: {
                apprentice: {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                validator: {
                    select: {
                        id: true,
                        displayName: true
                    }
                }
            }
        }
    },
    // Access control - users can only access roadbooks they own or guide
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // For read operations, check if the user is the apprentice or guide
        if (operation === 'read') {
            return data.apprenticeId === userId || data.guideId === userId;
        }
        // For create operations, set the user as the apprentice
        if (operation === 'create') {
            data.apprenticeId = userId;
            return true;
        }
        // For update/delete operations, only the apprentice can modify their roadbook
        return data.apprenticeId === userId;
    }
});
// Session service with access control
exports.sessionService = (0, crud_service_1.createCrudService)('session', {
    // Relations to include
    includeRelations: {
        apprentice: {
            select: {
                id: true,
                displayName: true
            }
        },
        validator: {
            select: {
                id: true,
                displayName: true
            }
        },
        roadbook: {
            select: {
                id: true,
                title: true,
                apprenticeId: true,
                guideId: true
            }
        }
    },
    // Before creating a session, validate the roadbook
    beforeCreate: async (data) => {
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: data.roadbookId },
            select: { id: true, apprenticeId: true }
        });
        if (!roadbook) {
            throw new Error('Roadbook not found');
        }
        // Set the apprentice ID from the roadbook if not provided
        if (!data.apprenticeId) {
            data.apprenticeId = roadbook.apprenticeId;
        }
        return data;
    },
    // Access control - users can only access sessions for roadbooks they own or guide
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // Get the roadbook to check permissions
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: data.roadbookId },
            select: { apprenticeId: true, guideId: true }
        });
        if (!roadbook) {
            return false;
        }
        // Both apprentice and guide can access sessions
        return roadbook.apprenticeId === userId || roadbook.guideId === userId;
    }
});
// Competency service
exports.competencyService = (0, crud_service_1.createCrudService)('competency', {
    // Only admins can create/update/delete competencies
    accessControl: async (userId, data, operation) => {
        // For read operations, anyone can access
        if (operation === 'read') {
            return true;
        }
        // For other operations, only admins can access
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
    }
});
// CompetencyProgress service
exports.competencyProgressService = (0, crud_service_1.createCrudService)('competencyProgress', {
    // Relations to include
    includeRelations: {
        competency: true,
        roadbook: {
            select: {
                id: true,
                title: true,
                apprenticeId: true,
                guideId: true
            }
        },
        apprentice: {
            select: {
                id: true,
                displayName: true
            }
        }
    },
    // Access control - apprentice and guide can access, but only guide can update
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // Get the roadbook to check permissions
        const roadbook = await prisma_1.default.roadBook.findUnique({
            where: { id: data.roadbookId },
            select: { apprenticeId: true, guideId: true }
        });
        if (!roadbook) {
            return false;
        }
        // For read operations, both apprentice and guide can access
        if (operation === 'read') {
            return roadbook.apprenticeId === userId || roadbook.guideId === userId;
        }
        // For other operations, only the guide can modify
        return roadbook.guideId === userId;
    }
});
// Post service
exports.postService = (0, crud_service_1.createCrudService)('post', {
    // Relations to include
    includeRelations: {
        author: {
            select: {
                id: true,
                displayName: true,
                profilePicture: true
            }
        },
        comments: {
            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                        profilePicture: true
                    }
                }
            }
        },
        _count: {
            select: {
                likes: true
            }
        }
    },
    // When creating a post, set the author
    beforeCreate: async (data) => {
        // The authorId should be set by the controller to the current user's ID
        if (!data.authorId) {
            throw new Error('Author ID is required');
        }
        return data;
    },
    // Access control - users can only modify their own posts
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // Anyone can read posts
        if (operation === 'read') {
            return true;
        }
        // For create operations, set the author to the current user
        if (operation === 'create') {
            data.authorId = userId;
            return true;
        }
        // For update/delete operations, only the author can modify
        return data.authorId === userId;
    }
});
// Comment service
exports.commentService = (0, crud_service_1.createCrudService)('comment', {
    // Relations to include
    includeRelations: {
        author: {
            select: {
                id: true,
                displayName: true,
                profilePicture: true
            }
        },
        post: {
            select: {
                id: true,
                title: true,
                authorId: true
            }
        },
        session: {
            select: {
                id: true,
                date: true,
                roadbookId: true
            }
        }
    },
    // When creating a comment, set the author
    beforeCreate: async (data) => {
        // The authorId should be set by the controller to the current user's ID
        if (!data.authorId) {
            throw new Error('Author ID is required');
        }
        // Check that either postId or sessionId is provided, but not both
        if ((data.postId && data.sessionId) || (!data.postId && !data.sessionId)) {
            throw new Error('Either post ID or session ID must be provided (but not both)');
        }
        return data;
    },
    // Access control - users can only modify their own comments
    accessControl: async (userId, data, operation) => {
        // Admins can do anything
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN') {
            return true;
        }
        // Anyone can read comments
        if (operation === 'read') {
            return true;
        }
        // For create operations, set the author to the current user
        if (operation === 'create') {
            data.authorId = userId;
            return true;
        }
        // For update/delete operations, only the author can modify
        return data.authorId === userId;
    }
});
// Badge service
exports.badgeService = (0, crud_service_1.createCrudService)('badge', {
    // Only admins can create/update/delete badges
    accessControl: async (userId, data, operation) => {
        // For read operations, anyone can access
        if (operation === 'read') {
            return true;
        }
        // For other operations, only admins can access
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
    }
});
// UserBadge service
exports.userBadgeService = (0, crud_service_1.createCrudService)('userBadge', {
    // Relations to include
    includeRelations: {
        user: {
            select: {
                id: true,
                displayName: true,
                profilePicture: true
            }
        },
        badge: true
    },
    // Only admins can assign badges
    accessControl: async (userId, data, operation) => {
        // Anyone can read badges
        if (operation === 'read') {
            return true;
        }
        // For other operations, only admins can access
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        return (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
    }
});
