import { Prisma, PrismaClient, Post, Comment, Like } from '@prisma/client';
import { prisma } from '../config/prisma';

// Pagination type
type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
};

// Rate limiter state
const rateLimits: Record<string, { count: number, timestamp: number }> = {};

/**
 * Check if a user has exceeded rate limits
 * @param userId ID of the user
 * @param actionType Type of action (post, comment, like)
 * @param limit Number of allowed actions
 * @param period Period in ms (default 1 hour)
 * @returns true if rate limit exceeded
 */
const isRateLimited = (
  userId: string,
  actionType: string,
  limit: number = 10,
  period: number = 3600000 // 1 hour in milliseconds
): boolean => {
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
const filterInappropriateContent = (content: string): string => {
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
const canAccessPost = async (userId: string, postId: string): Promise<boolean> => {
  const post = await prisma.post.findUnique({
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

  if (!post) return false;
  
  // Public posts for instructors are accessible by all
  if (post.author.role === 'INSTRUCTOR') return true;
  
  // Users can always access their own posts
  if (post.author.id === userId) return true;
  
  // Check if user is a guide to the post author
  const isGuideToAuthor = post.author.ownedRoadbooks.some(rb => rb.guideId === userId);
  if (isGuideToAuthor) return true;
  
  // Check if user is an apprentice of the post author
  const isApprenticeOfAuthor = post.author.guidedRoadbooks.some(rb => rb.apprenticeId === userId);
  if (isApprenticeOfAuthor) return true;
  
  // Check user role - admins can see all
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === 'ADMIN') return true;
  
  // Default to restricted access
  return false;
};

/**
 * Create a new post
 */
export const createPost = async (
  authorId: string,
  data: {
    title: string;
    content: string;
    mediaUrls?: string[];
  }
): Promise<Post> => {
  // Check rate limiting
  if (isRateLimited(authorId, 'post', 5)) {
    throw new Error('Rate limit exceeded for posting. Try again later.');
  }
  
  // Filter content
  const filteredContent = filterInappropriateContent(data.content);
  const filteredTitle = filterInappropriateContent(data.title);
  
  return prisma.post.create({
    data: {
      authorId,
      title: filteredTitle,
      content: filteredContent,
      mediaUrls: data.mediaUrls || [],
    },
  });
};

/**
 * Get all posts with pagination and filtering
 */
export const getPosts = async (
  params: PaginationParams = {},
  userId?: string
): Promise<{ posts: Post[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Building filter for visibility
  const whereClause: Prisma.PostWhereInput = {};
  
  // If userId provided, filter posts based on relationships
  if (userId) {
    const user = await prisma.user.findUnique({
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
          ...user.ownedRoadbooks.map(rb => rb.guideId).filter(Boolean) as string[], // Guides
        ];
        
        whereClause.authorId = { in: connectedUserIds };
      }
    }
  }
  
  // Count total posts
  const total = await prisma.post.count({ where: whereClause });
  
  // Get posts with pagination
  const posts = await prisma.post.findMany({
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
    posts: posts as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get a post by ID
 */
export const getPostById = async (
  postId: string,
  userId?: string
): Promise<Post | null> => {
  // Check visibility if userId provided
  if (userId && !(await canAccessPost(userId, postId))) {
    throw new Error('You do not have permission to view this post');
  }
  
  return prisma.post.findUnique({
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
  }) as any; // Type cast because of _count
};

/**
 * Update a post
 */
export const updatePost = async (
  postId: string,
  authorId: string,
  data: Partial<{
    title: string;
    content: string;
    mediaUrls: string[];
  }>
): Promise<Post> => {
  // Check if post exists and belongs to user
  const existingPost = await prisma.post.findUnique({
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
  const updateData: Prisma.PostUpdateInput = {};
  
  if (data.title) {
    updateData.title = filterInappropriateContent(data.title);
  }
  
  if (data.content) {
    updateData.content = filterInappropriateContent(data.content);
  }
  
  if (data.mediaUrls) {
    updateData.mediaUrls = data.mediaUrls;
  }
  
  return prisma.post.update({
    where: { id: postId },
    data: updateData,
  });
};

/**
 * Delete a post
 */
export const deletePost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  // Check if post exists and user has permission
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  
  if (!post) {
    throw new Error('Post not found');
  }
  
  // Allow deletion by post author or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (post.authorId !== userId && user?.role !== 'ADMIN') {
    throw new Error('You do not have permission to delete this post');
  }
  
  // Delete likes, comments, and post in a transaction
  await prisma.$transaction([
    prisma.like.deleteMany({ where: { postId } }),
    prisma.comment.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } }),
  ]);
  
  return true;
};

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  authorId: string,
  content: string
): Promise<Comment> => {
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
  const comment = await prisma.comment.create({
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
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, title: true },
  });
  
  if (post && post.authorId !== authorId) {
    await prisma.notification.create({
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

/**
 * Delete a comment
 */
export const deleteComment = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  // Check if comment exists and user has permission
  const comment = await prisma.comment.findUnique({
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (
    comment.authorId !== userId && 
    comment.post?.authorId !== userId &&
    user?.role !== 'ADMIN'
  ) {
    throw new Error('You do not have permission to delete this comment');
  }
  
  await prisma.comment.delete({ where: { id: commentId } });
  return true;
};

/**
 * Add a like to a post
 */
export const likePost = async (
  postId: string,
  userId: string
): Promise<Like> => {
  // Check rate limiting
  if (isRateLimited(userId, 'like', 30)) {
    throw new Error('Rate limit exceeded for liking. Try again later.');
  }
  
  // Check if post exists and user can access it
  if (!(await canAccessPost(userId, postId))) {
    throw new Error('You do not have permission to like this post');
  }
  
  // Check if already liked
  const existingLike = await prisma.like.findFirst({
    where: {
      postId,
      userId,
    },
  });
  
  if (existingLike) {
    throw new Error('You have already liked this post');
  }
  
  // Create like
  return prisma.like.create({
    data: {
      postId,
      userId,
    },
  });
};

/**
 * Remove a like from a post
 */
export const unlikePost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  // Delete like
  const result = await prisma.like.deleteMany({
    where: {
      postId,
      userId,
    },
  });
  
  return result.count > 0;
};

/**
 * Get users who liked a post
 */
export const getPostLikes = async (
  postId: string,
  params: PaginationParams = {}
): Promise<{ users: any[]; total: number; pages: number }> => {
  const { page = 1, limit = 10 } = params;
  const skip = (page - 1) * limit;
  
  // Count total likes
  const total = await prisma.like.count({ where: { postId } });
  
  // Get likes with user info
  const likes = await prisma.like.findMany({
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

/**
 * Check if user has liked a post
 */
export const hasUserLikedPost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  const like = await prisma.like.findFirst({
    where: {
      postId,
      userId,
    },
  });
  
  return !!like;
};

/**
 * Get posts by user
 */
export const getPostsByUser = async (
  authorId: string,
  params: PaginationParams = {}
): Promise<{ posts: Post[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Count total posts by user
  const total = await prisma.post.count({ where: { authorId } });
  
  // Get posts with pagination
  const posts = await prisma.post.findMany({
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
    posts: posts as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Search posts
 */
export const searchPosts = async (
  query: string,
  params: PaginationParams = {},
  userId?: string
): Promise<{ posts: Post[]; total: number; pages: number }> => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
  const skip = (page - 1) * limit;
  
  // Build filter
  const whereClause: Prisma.PostWhereInput = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ],
  };
  
  // If userId provided, filter posts based on relationships
  if (userId) {
    const user = await prisma.user.findUnique({
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
        ...user.ownedRoadbooks.map(rb => rb.guideId).filter(Boolean) as string[], // Guides
      ];
      
      whereClause.authorId = { in: connectedUserIds };
    }
  }
  
  // Count total matching posts
  const total = await prisma.post.count({ where: whereClause });
  
  // Get posts with pagination
  const posts = await prisma.post.findMany({
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
    posts: posts as any, // Type cast because of _count
    total,
    pages: Math.ceil(total / limit),
  };
};