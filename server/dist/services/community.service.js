"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPosts = exports.getPostsByUser = exports.hasUserLikedPost = exports.getPostLikes = exports.unlikePost = exports.likePost = exports.deleteComment = exports.addComment = exports.deletePost = exports.updatePost = exports.getPostById = exports.getPosts = exports.createPost = void 0;
const prisma_1 = require("../config/prisma");
// Rate limiter state
const rateLimits = {};
/**
 * Check if a user has exceeded rate limits
 * @param userId ID of the user
 * @param actionType Type of action (post, comment, like)
 * @param limit Number of allowed actions
 * @param period Period in ms (default 1 hour)
 * @returns true if rate limit exceeded
 */
const isRateLimited = (userId, actionType, limit = 10, period = 3600000 // 1 hour in milliseconds
) => {
    const key = `${userId}:${actionType}`;
    const now = Date.now();
    // Initialize if not exists
    if (!rateLimits[key]) {
        rateLimits[key] = { count: 0, timestamp: now };
    }
    // Reset counter if period has passed
    if (now - rateLimits[key].timestamp > period) {
        rateLimits[key] = { count: 0, timestamp: now };
    }
    // Check if limit exceeded
    if (rateLimits[key].count >= limit) {
        return true;
    }
    // Increment counter
    rateLimits[key].count++;
    return false;
};
/**
 * Filter inappropriate content using a simple approach
 * @param content Text content to check
 * @returns Filtered content
 */
const filterInappropriateContent = (content) => {
    // List of words to filter - would be more comprehensive in production
    const inappropriateWords = ['badword1', 'badword2', 'badword3'];
    let filteredContent = content;
    inappropriateWords.forEach(word => {
        // Replace with asterisks
        const regex = new RegExp(word, 'gi');
        filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
    return filteredContent;
};
/**
 * Check if user can access a post based on relationships
 * @param userId ID of the user
 * @param postId ID of the post
 */
const canAccessPost = async (userId, postId) => {
    const post = await prisma_1.prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    role: true,
                    guidedRoadbooks: {
                        select: {
                            apprenticeId: true,
                        },
                    },
                    ownedRoadbooks: {
                        select: {
                            guideId: true,
                        },
                    },
                },
            },
        },
    });
    if (!post)
        return false;
    // Public posts for instructors are accessible by all
    if (post.author.role === 'INSTRUCTOR')
        return true;
    // Users can always access their own posts
    if (post.author.id === userId)
        return true;
    // Check if user is a guide to the post author
    const isGuideToAuthor = post.author.ownedRoadbooks.some(rb => rb.guideId === userId);
    if (isGuideToAuthor)
        return true;
    // Check if user is an apprentice of the post author
    const isApprenticeOfAuthor = post.author.guidedRoadbooks.some(rb => rb.apprenticeId === userId);
    if (isApprenticeOfAuthor)
        return true;
    // Check user role - admins can see all
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if ((user === null || user === void 0 ? void 0 : user.role) === 'ADMIN')
        return true;
    // Default to restricted access
    return false;
};
/**
 * Create a new post
 */
const createPost = async (authorId, data) => {
    // Check rate limiting
    if (isRateLimited(authorId, 'post', 5)) {
        throw new Error('Rate limit exceeded for posting. Try again later.');
    }
    // Filter content
    const filteredContent = filterInappropriateContent(data.content);
    const filteredTitle = filterInappropriateContent(data.title);
    return prisma_1.prisma.post.create({
        data: {
            authorId,
            title: filteredTitle,
            content: filteredContent,
            mediaUrls: data.mediaUrls || [],
        },
    });
};
exports.createPost = createPost;
/**
 * Get all posts with pagination and filtering
 */
const getPosts = async (params = {}, userId) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Building filter for visibility
    const whereClause = {};
    // If userId provided, filter posts based on relationships
    if (userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                guidedRoadbooks: { select: { apprenticeId: true } },
                ownedRoadbooks: { select: { guideId: true } },
            },
        });
        if (user) {
            // If admin, show all posts
            if (user.role !== 'ADMIN') {
                // For non-admins, filter based on relationships
                const connectedUserIds = [
                    userId, // Own posts
                    ...user.guidedRoadbooks.map(rb => rb.apprenticeId), // Apprentices
                    ...user.ownedRoadbooks.map(rb => rb.guideId).filter(Boolean), // Guides
                ];
                whereClause.authorId = { in: connectedUserIds };
            }
        }
    }
    // Count total posts
    const total = await prisma_1.prisma.post.count({ where: whereClause });
    // Get posts with pagination
    const posts = await prisma_1.prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                    role: true,
                },
            },
            _count: {
                select: {
                    comments: true,
                    likes: true,
                },
            },
        },
    });
    return {
        posts: posts, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getPosts = getPosts;
/**
 * Get a post by ID
 */
const getPostById = async (postId, userId) => {
    // Check visibility if userId provided
    if (userId && !(await canAccessPost(userId, postId))) {
        throw new Error('You do not have permission to view this post');
    }
    return prisma_1.prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                    role: true,
                },
            },
            comments: {
                include: {
                    author: {
                        select: {
                            id: true,
                            displayName: true,
                            profilePicture: true,
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
            },
            _count: {
                select: {
                    likes: true,
                },
            },
        },
    }); // Type cast because of _count
};
exports.getPostById = getPostById;
/**
 * Update a post
 */
const updatePost = async (postId, authorId, data) => {
    // Check if post exists and belongs to user
    const existingPost = await prisma_1.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
    });
    if (!existingPost) {
        throw new Error('Post not found');
    }
    if (existingPost.authorId !== authorId) {
        throw new Error('You do not have permission to update this post');
    }
    // Filter content if provided
    const updateData = {};
    if (data.title) {
        updateData.title = filterInappropriateContent(data.title);
    }
    if (data.content) {
        updateData.content = filterInappropriateContent(data.content);
    }
    if (data.mediaUrls) {
        updateData.mediaUrls = data.mediaUrls;
    }
    return prisma_1.prisma.post.update({
        where: { id: postId },
        data: updateData,
    });
};
exports.updatePost = updatePost;
/**
 * Delete a post
 */
const deletePost = async (postId, userId) => {
    // Check if post exists and user has permission
    const post = await prisma_1.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
    });
    if (!post) {
        throw new Error('Post not found');
    }
    // Allow deletion by post author or admin
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (post.authorId !== userId && (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to delete this post');
    }
    // Delete likes, comments, and post in a transaction
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.like.deleteMany({ where: { postId } }),
        prisma_1.prisma.comment.deleteMany({ where: { postId } }),
        prisma_1.prisma.post.delete({ where: { id: postId } }),
    ]);
    return true;
};
exports.deletePost = deletePost;
/**
 * Add a comment to a post
 */
const addComment = async (postId, authorId, content) => {
    // Check rate limiting
    if (isRateLimited(authorId, 'comment', 20)) {
        throw new Error('Rate limit exceeded for commenting. Try again later.');
    }
    // Check if post exists and user can access it
    if (!(await canAccessPost(authorId, postId))) {
        throw new Error('You do not have permission to comment on this post');
    }
    // Filter content
    const filteredContent = filterInappropriateContent(content);
    // Create comment
    const comment = await prisma_1.prisma.comment.create({
        data: {
            content: filteredContent,
            authorId,
            postId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                },
            },
        },
    });
    // Create notification for post author
    const post = await prisma_1.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
    });
    if (post && post.authorId !== authorId) {
        await prisma_1.prisma.notification.create({
            data: {
                userId: post.authorId,
                type: 'COMMENT_RECEIVED',
                title: 'Nouveau commentaire',
                message: `${comment.author.displayName} a commenté votre publication "${post.title}"`,
                linkUrl: `/community/posts/${postId}`,
            },
        });
    }
    return comment;
};
exports.addComment = addComment;
/**
 * Delete a comment
 */
const deleteComment = async (commentId, userId) => {
    var _a;
    // Check if comment exists and user has permission
    const comment = await prisma_1.prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            post: {
                select: {
                    authorId: true,
                },
            },
        },
    });
    if (!comment) {
        throw new Error('Comment not found');
    }
    // Allow deletion by comment author, post author, or admin
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (comment.authorId !== userId &&
        ((_a = comment.post) === null || _a === void 0 ? void 0 : _a.authorId) !== userId &&
        (user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
        throw new Error('You do not have permission to delete this comment');
    }
    await prisma_1.prisma.comment.delete({ where: { id: commentId } });
    return true;
};
exports.deleteComment = deleteComment;
/**
 * Add a like to a post
 */
const likePost = async (postId, userId) => {
    // Check rate limiting
    if (isRateLimited(userId, 'like', 30)) {
        throw new Error('Rate limit exceeded for liking. Try again later.');
    }
    // Check if post exists and user can access it
    if (!(await canAccessPost(userId, postId))) {
        throw new Error('You do not have permission to like this post');
    }
    // Check if already liked
    const existingLike = await prisma_1.prisma.like.findFirst({
        where: {
            postId,
            userId,
        },
    });
    if (existingLike) {
        throw new Error('You have already liked this post');
    }
    // Create like
    return prisma_1.prisma.like.create({
        data: {
            postId,
            userId,
        },
    });
};
exports.likePost = likePost;
/**
 * Remove a like from a post
 */
const unlikePost = async (postId, userId) => {
    // Delete like
    const result = await prisma_1.prisma.like.deleteMany({
        where: {
            postId,
            userId,
        },
    });
    return result.count > 0;
};
exports.unlikePost = unlikePost;
/**
 * Get users who liked a post
 */
const getPostLikes = async (postId, params = {}) => {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    // Count total likes
    const total = await prisma_1.prisma.like.count({ where: { postId } });
    // Get likes with user info
    const likes = await prisma_1.prisma.like.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                    role: true,
                },
            },
        },
    });
    return {
        users: likes.map(like => like.user),
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getPostLikes = getPostLikes;
/**
 * Check if user has liked a post
 */
const hasUserLikedPost = async (postId, userId) => {
    const like = await prisma_1.prisma.like.findFirst({
        where: {
            postId,
            userId,
        },
    });
    return !!like;
};
exports.hasUserLikedPost = hasUserLikedPost;
/**
 * Get posts by user
 */
const getPostsByUser = async (authorId, params = {}) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Count total posts by user
    const total = await prisma_1.prisma.post.count({ where: { authorId } });
    // Get posts with pagination
    const posts = await prisma_1.prisma.post.findMany({
        where: { authorId },
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                    role: true,
                },
            },
            _count: {
                select: {
                    comments: true,
                    likes: true,
                },
            },
        },
    });
    return {
        posts: posts, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.getPostsByUser = getPostsByUser;
/**
 * Search posts
 */
const searchPosts = async (query, params = {}, userId) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
    const skip = (page - 1) * limit;
    // Build filter
    const whereClause = {
        OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
        ],
    };
    // If userId provided, filter posts based on relationships
    if (userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                guidedRoadbooks: { select: { apprenticeId: true } },
                ownedRoadbooks: { select: { guideId: true } },
            },
        });
        if (user && user.role !== 'ADMIN') {
            // For non-admins, filter based on relationships
            const connectedUserIds = [
                userId, // Own posts
                ...user.guidedRoadbooks.map(rb => rb.apprenticeId), // Apprentices
                ...user.ownedRoadbooks.map(rb => rb.guideId).filter(Boolean), // Guides
            ];
            whereClause.authorId = { in: connectedUserIds };
        }
    }
    // Count total matching posts
    const total = await prisma_1.prisma.post.count({ where: whereClause });
    // Get posts with pagination
    const posts = await prisma_1.prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                    profilePicture: true,
                    role: true,
                },
            },
            _count: {
                select: {
                    comments: true,
                    likes: true,
                },
            },
        },
    });
    return {
        posts: posts, // Type cast because of _count
        total,
        pages: Math.ceil(total / limit),
    };
};
exports.searchPosts = searchPosts;
