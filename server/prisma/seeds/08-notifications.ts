// prisma/seeds/08-notifications.ts
import { PrismaClient, NotificationType } from "@prisma/client";

export async function seedNotifications(prisma: PrismaClient) {
  console.log("Seeding notifications...");

  // Get users for relationships
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.warn("⚠️ No users found. Skipping notifications seeding.");
    return;
  }

  // Create notifications for each user
  for (const user of users) {
    const numNotifications = Math.floor(Math.random() * 5) + 1; // 1-5 notifications per user

    // Create different types of notifications based on user role
    const notifications = [];

    if (user.role === "APPRENTICE") {
      notifications.push({
        userId: user.id,
        type: "SESSION_REMINDER" as NotificationType,
        title: "Rappel de session",
        message: "Vous avez une session de conduite prévue demain à 14h00.",
        isRead: Math.random() > 0.5,
        linkUrl: "/dashboard/sessions",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000
        ),
      });

      notifications.push({
        userId: user.id,
        type: "COMPETENCY_MASTERED" as NotificationType,
        title: "Compétence maîtrisée !",
        message:
          'Félicitations ! Votre guide a validé la compétence "Passer les vitesses".',
        isRead: Math.random() > 0.5,
        linkUrl: "/dashboard/competencies",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
        ),
      });

      notifications.push({
        userId: user.id,
        type: "BADGE_EARNED" as NotificationType,
        title: "Badge obtenu",
        message: 'Vous avez obtenu le badge "Premier Voyage" !',
        isRead: false,
        linkUrl: "/dashboard/badges",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000
        ),
      });
    } else if (user.role === "GUIDE") {
      notifications.push({
        userId: user.id,
        type: "SESSION_VALIDATION" as NotificationType,
        title: "Session à valider",
        message: "Paul a enregistré une nouvelle session. Veuillez la valider.",
        isRead: Math.random() > 0.3,
        linkUrl: "/dashboard/sessions",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000
        ),
      });

      notifications.push({
        userId: user.id,
        type: "COMMENT_RECEIVED" as NotificationType,
        title: "Nouveau commentaire",
        message:
          "Paul a commenté votre feedback sur sa dernière session de conduite.",
        isRead: Math.random() > 0.7,
        linkUrl: "/community/posts",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000
        ),
      });
    } else {
      notifications.push({
        userId: user.id,
        type: "MARKETPLACE_UPDATE" as NotificationType,
        title: "Nouvel article disponible",
        message:
          "Un nouveau cours de perfectionnement a été ajouté à la marketplace.",
        isRead: true,
        linkUrl: "/marketplace",
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000
        ),
      });
    }

    // Add some common notifications for all users
    notifications.push({
      userId: user.id,
      type: "COMMENT_RECEIVED" as NotificationType,
      title: "Nouvelle réponse",
      message: "Quelqu'un a répondu à votre commentaire dans la communauté.",
      isRead: Math.random() > 0.5,
      linkUrl: "/community",
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
      ),
    });

    // Take a random subset of notifications to create
    const notificationsToCreate = notifications.slice(0, numNotifications);

    for (const notification of notificationsToCreate) {
      await prisma.notification.create({
        data: notification,
      });
    }
  }

  const totalNotifications = await prisma.notification.count();
  console.log(`✅ Created ${totalNotifications} notifications`);
}
