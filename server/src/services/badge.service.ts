import { Badge, Prisma, PrismaClient, User, UserBadge } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadgeAwardCriteria, checkBadgeCriteria } from '../utils/badge-criteria';

export type BadgeWithUserCount = Badge & {
  _count: {
    userBadges: number;
  };
};

/**
 * Get all badges in the system
 */
export const getAllBadges = async (): Promise<BadgeWithUserCount[]> => {
  return prisma.badge.findMany({
    include: {
      _count: {
        select: {
          userBadges: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
};

/**
 * Get a single badge by ID
 */
export const getBadgeById = async (badgeId: string): Promise<Badge | null> => {
  return prisma.badge.findUnique({
    where: { id: badgeId },
  });
};

/**
 * Get badges for a specific user
 */
export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  return prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: {
      awardedAt: 'desc',
    },
  });
};

/**
 * Award a badge to a user
 */
export const awardBadge = async (
  userId: string,
  badgeId: string
): Promise<UserBadge> => {
  // Check if user already has this badge
  const existingBadge = await prisma.userBadge.findFirst({
    where: {
      userId,
      badgeId,
    },
  });

  if (existingBadge) {
    throw new Error('User already has this badge');
  }

  // Award the badge
  const userBadge = await prisma.userBadge.create({
    data: {
      userId,
      badgeId,
    },
    include: {
      badge: true,
    },
  });

  // Create a notification for the user
  await prisma.notification.create({
    data: {
      userId,
      type: 'BADGE_EARNED',
      title: 'Nouveau badge obtenu !',
      message: `Vous avez obtenu le badge "${userBadge.badge.name}"`,
      linkUrl: `/profile/badges`,
    },
  });

  return userBadge;
};

/**
 * Revoke a badge from a user
 */
export const revokeBadge = async (
  userId: string,
  badgeId: string
): Promise<void> => {
  await prisma.userBadge.deleteMany({
    where: {
      userId,
      badgeId,
    },
  });
};

/**
 * Check and award badges for user based on their activity
 * This should be called after relevant actions (session completion, competency mastery, etc.)
 */
export const checkAndAwardBadges = async (userId: string): Promise<UserBadge[]> => {
  // Get user data and current badges
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      receivedBadges: {
        select: {
          badgeId: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get all badges
  const allBadges = await prisma.badge.findMany();
  
  // Get existing badge IDs
  const existingBadgeIds = user.receivedBadges.map((ub) => ub.badgeId);
  
  // Check each badge's criteria
  const badgesToAward: Badge[] = [];
  
  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (existingBadgeIds.includes(badge.id)) {
      continue;
    }
    
    // Check if user meets criteria for this badge
    const meetsAllCriteria = await checkBadgeCriteria(userId, badge.criteria as BadgeAwardCriteria);
    
    if (meetsAllCriteria) {
      badgesToAward.push(badge);
    }
  }
  
  // Award badges and collect results
  const awardedBadges: UserBadge[] = [];
  
  for (const badge of badgesToAward) {
    try {
      const userBadge = await awardBadge(userId, badge.id);
      awardedBadges.push(userBadge);
    } catch (error) {
      console.error(`Failed to award badge ${badge.name} to user ${userId}:`, error);
    }
  }
  
  return awardedBadges;
};

/**
 * Create a new badge (admin only)
 */
export const createBadge = async (badgeData: Prisma.BadgeCreateInput): Promise<Badge> => {
  return prisma.badge.create({
    data: badgeData,
  });
};

/**
 * Update a badge (admin only)
 */
export const updateBadge = async (
  badgeId: string,
  badgeData: Prisma.BadgeUpdateInput
): Promise<Badge> => {
  return prisma.badge.update({
    where: { id: badgeId },
    data: badgeData,
  });
};

/**
 * Delete a badge (admin only)
 * This will also remove the badge from all users who have it
 */
export const deleteBadge = async (badgeId: string): Promise<void> => {
  await prisma.userBadge.deleteMany({
    where: { badgeId },
  });
  
  await prisma.badge.delete({
    where: { id: badgeId },
  });
};

/**
 * Get badges by category
 */
export const getBadgesByCategory = async (category: string): Promise<Badge[]> => {
  return prisma.badge.findMany({
    where: { category },
    orderBy: {
      name: 'asc',
    },
  });
};

/**
 * Get leaderboard of users with most badges
 */
export const getBadgeLeaderboard = async (limit: number = 10): Promise<any[]> => {
  const leaderboard = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      profilePicture: true,
      _count: {
        select: {
          receivedBadges: true,
        },
      },
      receivedBadges: {
        select: {
          badge: {
            select: {
              name: true,
              imageUrl: true,
              category: true,
            },
          },
          awardedAt: true,
        },
        orderBy: {
          awardedAt: 'desc',
        },
        take: 5, // Get only the 5 most recent badges
      },
    },
    orderBy: {
      receivedBadges: {
        _count: 'desc',
      },
    },
    take: limit,
  });

  return leaderboard;
};
