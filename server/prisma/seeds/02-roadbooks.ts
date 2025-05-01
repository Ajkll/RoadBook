// prisma/seeds/02-roadbooks.ts
import { PrismaClient, RoadBookStatus } from "@prisma/client";

export async function seedRoadbooks(prisma: PrismaClient) {
  console.log("Seeding roadbooks...");

  // Get users for relationships
  const apprentices = await prisma.user.findMany({
    where: { role: "APPRENTICE" },
  });

  const guides = await prisma.user.findMany({
    where: { role: "GUIDE" },
  });

  if (apprentices.length === 0) {
    console.warn("⚠️ No apprentices found. Skipping roadbook seeding.");
    return [];
  }

  const roadbooks = [
    {
      title: "Mon premier RoadBook",
      description: "Apprentissage de la conduite pour obtenir mon permis B",
      status: "ACTIVE" as RoadBookStatus,
      targetHours: 30,
      apprenticeId: apprentices[0].id,
      guideId: guides[0].id,
      lastExportDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      title: "Formation permis B",
      description:
        "Documentation de mes heures de conduite et compétences acquises",
      status: "ACTIVE" as RoadBookStatus,
      targetHours: 30,
      apprenticeId: apprentices[1].id,
      guideId: guides[1].id,
    },
  ];

  const createdRoadbooks = [];

  for (const roadbook of roadbooks) {
    const created = await prisma.roadBook.upsert({
      where: {
        // We don't have a natural unique field, so we'll use the title + apprenticeId
        id: await prisma.roadBook
          .findFirst({
            where: {
              title: roadbook.title,
              apprenticeId: roadbook.apprenticeId,
            },
          })
          .then((rb) => rb?.id || "new-id"),
      },
      update: roadbook,
      create: roadbook,
    });
    createdRoadbooks.push(created);
  }

  console.log(`✅ Created ${createdRoadbooks.length} roadbooks`);
  return createdRoadbooks;
}
