// prisma/seeds/06-badges.ts
import { PrismaClient } from "@prisma/client";

export async function seedBadges(prisma: PrismaClient) {
  console.log("Seeding badges...");

  // Create badges
  const badges = [
    {
      name: "Premier Voyage",
      description: "A effectué sa première séance de conduite",
      imageUrl: "/badges/first-trip.svg",
      category: "BEGINNER",
      criteria: "Enregistrer une première session de conduite",
    },
    {
      name: "Roi du Créneau",
      description: "A maîtrisé le stationnement en créneau",
      imageUrl: "/badges/parking-master.svg",
      category: "MANEUVERING",
      criteria: "Valider la compétence de stationnement en créneau",
    },
    {
      name: "Conducteur Nocturne",
      description: "A conduit de nuit",
      imageUrl: "/badges/night-driver.svg",
      category: "ADVANCED",
      criteria: "Effectuer au moins une session de conduite de nuit",
    },
    {
      name: "Pilote d'Autoroute",
      description: "A conduit sur autoroute",
      imageUrl: "/badges/highway-driver.svg",
      category: "ADVANCED",
      criteria: "Valider la compétence de conduite sur autoroute",
    },
    {
      name: "Mentor Actif",
      description: "A validé plus de 10 sessions de conduite",
      imageUrl: "/badges/active-mentor.svg",
      category: "SOCIAL",
      criteria: "Valider 10 sessions de conduite en tant que guide",
    },
    {
      name: "Expert en Écoconduite",
      description: "A maîtrisé les techniques d'écoconduite",
      imageUrl: "/badges/eco-driver.svg",
      category: "SPECIAL",
      criteria: "Valider toutes les compétences liées à l'écoconduite",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ Created ${badges.length} badges`);

  // Award some badges to users
  const users = await prisma.user.findMany();
  const createdBadges = await prisma.badge.findMany();

  // Award "Premier Voyage" to all apprentices
  const apprentices = users.filter((u) => u.role === "APPRENTICE");
  const firstTripBadge = createdBadges.find((b) => b.name === "Premier Voyage");

  if (firstTripBadge && apprentices.length > 0) {
    for (const apprentice of apprentices) {
      await prisma.userBadge.create({
        data: {
          userId: apprentice.id,
          badgeId: firstTripBadge.id,
          awardedAt: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
          ),
        },
      });
    }
  }

  // Award "Mentor Actif" to one guide
  const guides = users.filter((u) => u.role === "GUIDE");
  const mentorBadge = createdBadges.find((b) => b.name === "Mentor Actif");

  if (mentorBadge && guides.length > 0) {
    await prisma.userBadge.create({
      data: {
        userId: guides[0].id,
        badgeId: mentorBadge.id,
        awardedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Award random badges to random users
  const totalRandomBadges = 3; // Number of random badges to award
  for (let i = 0; i < totalRandomBadges; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomBadge =
      createdBadges[Math.floor(Math.random() * createdBadges.length)];

    // Check if already awarded
    const existingBadge = await prisma.userBadge.findFirst({
      where: {
        userId: randomUser.id,
        badgeId: randomBadge.id,
      },
    });

    if (!existingBadge) {
      await prisma.userBadge.create({
        data: {
          userId: randomUser.id,
          badgeId: randomBadge.id,
          awardedAt: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
          ),
        },
      });
    }
  }

  console.log("✅ Awarded badges to users");
}
