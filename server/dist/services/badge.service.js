"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBadgeLeaderboard = exports.getBadgesByCategory = exports.deleteBadge = exports.updateBadge = exports.createBadge = exports.checkAndAwardBadges = exports.revokeBadge = exports.awardBadge = exports.getUserBadges = exports.getBadgeById = exports.getAllBadges = void 0;
const prisma_1 = require("../config/prisma");
const badge_criteria_1 = require("../utils/badge-criteria");
/**
 * Get all badges in the system
 */
const getAllBadges = async () => {
    return prisma_1.prisma.badge.findMany({
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
exports.getAllBadges = getAllBadges;
/**
 * Get a single badge by ID
 */
const getBadgeById = async (badgeId) => {
    return prisma_1.prisma.badge.findUnique({
        where: { id: badgeId },
    });
};
exports.getBadgeById = getBadgeById;
/**
 * Get badges for a specific user
 */
const getUserBadges = async (userId) => {
    return prisma_1.prisma.userBadge.findMany({
        where: { userId },
        include: {
            badge: true,
        },
        orderBy: {
            awardedAt: 'desc',
        },
    });
};
exports.getUserBadges = getUserBadges;
/**
 * Award a badge to a user
 */
const awardBadge = async (userId, badgeId) => {
    // Check if user already has this badge
    const existingBadge = await prisma_1.prisma.userBadge.findFirst({
        where: {
            userId,
            badgeId,
        },
    });
    if (existingBadge) {
        throw new Error('User already has this badge');
    }
    // Award the badge
    const userBadge = await prisma_1.prisma.userBadge.create({
        data: {
            userId,
            badgeId,
        },
        include: {
            badge: true,
        },
    });
    // Create a notification for the user
    await prisma_1.prisma.notification.create({
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
exports.awardBadge = awardBadge;
/**
 * Revoke a badge from a user
 */
const revokeBadge = async (userId, badgeId) => {
    await prisma_1.prisma.userBadge.deleteMany({
        where: {
            userId,
            badgeId,
        },
    });
};
exports.revokeBadge = revokeBadge;
/**
 * Check and award badges for user based on their activity
 * This should be called after relevant actions (session completion, competency mastery, etc.)
 */
const checkAndAwardBadges = async (userId) => {
    // Get user data and current badges
    const user = await prisma_1.prisma.user.findUnique({
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
    const allBadges = await prisma_1.prisma.badge.findMany();
    // Get existing badge IDs
    const existingBadgeIds = user.receivedBadges.map((ub) => ub.badgeId);
    // Check each badge's criteria
    const badgesToAward = [];
    for (const badge of allBadges) {
        // Skip if user already has this badge
        if (existingBadgeIds.includes(badge.id)) {
            continue;
        }
        // Check if user meets criteria for this badge
        const meetsAllCriteria = await (0, badge_criteria_1.checkBadgeCriteria)(userId, badge.criteria);
        if (meetsAllCriteria) {
            badgesToAward.push(badge);
        }
    }
    // Award badges and collect results
    const awardedBadges = [];
    for (const badge of badgesToAward) {
        try {
            const userBadge = await (0, exports.awardBadge)(userId, badge.id);
            awardedBadges.push(userBadge);
        }
        catch (error) {
            console.error(`Failed to award badge ${badge.name} to user ${userId}:`, error);
        }
    }
    return awardedBadges;
};
exports.checkAndAwardBadges = checkAndAwardBadges;
/**
 * Create a new badge (admin only)
 */
const createBadge = async (badgeData) => {
    return prisma_1.prisma.badge.create({
        data: badgeData,
    });
};
exports.createBadge = createBadge;
/**
 * Update a badge (admin only)
 */
const updateBadge = async (badgeId, badgeData) => {
    return prisma_1.prisma.badge.update({
        where: { id: badgeId },
        data: badgeData,
    });
};
exports.updateBadge = updateBadge;
/**
 * Delete a badge (admin only)
 * This will also remove the badge from all users who have it
 */
const deleteBadge = async (badgeId) => {
    await prisma_1.prisma.userBadge.deleteMany({
        where: { badgeId },
    });
    await prisma_1.prisma.badge.delete({
        where: { id: badgeId },
    });
};
exports.deleteBadge = deleteBadge;
/**
 * Get badges by category
 */
const getBadgesByCategory = async (category) => {
    return prisma_1.prisma.badge.findMany({
        where: { category },
        orderBy: {
            name: 'asc',
        },
    });
};
exports.getBadgesByCategory = getBadgesByCategory;
/**
 * Get leaderboard of users with most badges
 */
const getBadgeLeaderboard = async (limit = 10) => {
    const leaderboard = await prisma_1.prisma.user.findMany({
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
exports.getBadgeLeaderboard = getBadgeLeaderboard;
