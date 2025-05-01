// prisma/seeds/04-competencies.ts
import {
  PrismaClient,
  LearningPhase,
  CompetencyCategory,
  CompetencyStatus,
} from "@prisma/client";

export async function seedCompetencies(prisma: PrismaClient) {
  console.log("Seeding competencies...");

  // Define competencies based on Belgian RoadBook
  const competencies = [
    // Phase 1: Premiers contacts avec le véhicule
    {
      name: "Contrôle externe de la voiture",
      description:
        "Vérifier l'environnement extérieur de la voiture, l'état des pneus, la propreté des vitres et des feux.",
      phase: "PHASE1" as LearningPhase,
      category: "CONTROL" as CompetencyCategory,
      order: 1,
      officialCode: "P1C1",
    },
    {
      name: "Contrôle interne de la voiture",
      description:
        "Vérifier qu'il n'y ait pas d'objets susceptibles de gêner la conduite, vérifier les niveaux de carburant et fluides.",
      phase: "PHASE1" as LearningPhase,
      category: "CONTROL" as CompetencyCategory,
      order: 2,
      officialCode: "P1C2",
    },
    {
      name: "Installation correcte au volant",
      description:
        "S'installer correctement, régler le siège, l'appuie-tête et adopter une bonne position des mains.",
      phase: "PHASE1" as LearningPhase,
      category: "CONTROL" as CompetencyCategory,
      order: 3,
      officialCode: "P1C3",
    },

    // Phase 2: Maîtrise de base du véhicule
    {
      name: "Démarrer et passer la première",
      description:
        "Mettre le contact, identifier les pédales et démarrer correctement.",
      phase: "PHASE2" as LearningPhase,
      category: "MANEUVERING" as CompetencyCategory,
      order: 1,
      officialCode: "P2C1",
    },
    {
      name: "Passer les vitesses",
      description: "Changer de vitesse sans à-coups et au bon moment.",
      phase: "PHASE2" as LearningPhase,
      category: "MANEUVERING" as CompetencyCategory,
      order: 2,
      officialCode: "P2C2",
    },
    {
      name: "Maîtriser le freinage",
      description:
        "Utiliser le frein moteur et la pédale de frein correctement.",
      phase: "PHASE2" as LearningPhase,
      category: "MANEUVERING" as CompetencyCategory,
      order: 3,
      officialCode: "P2C3",
    },

    // Phase 3: Maîtrise en situation simple
    {
      name: "Tourner à droite et à gauche",
      description: "Effectuer correctement des virages à droite et à gauche.",
      phase: "PHASE3" as LearningPhase,
      category: "MANEUVERING" as CompetencyCategory,
      order: 1,
      officialCode: "P3C1",
    },
    {
      name: "Aborder un rond-point",
      description: "Entrer, circuler et sortir correctement d'un rond-point.",
      phase: "PHASE3" as LearningPhase,
      category: "TRAFFIC_RULES" as CompetencyCategory,
      order: 2,
      officialCode: "P3C2",
    },
    {
      name: "Effectuer un créneau",
      description: "Réaliser un stationnement en créneau en toute sécurité.",
      phase: "PHASE3" as LearningPhase,
      category: "MANEUVERING" as CompetencyCategory,
      order: 3,
      officialCode: "P3C3",
    },

    // Phase 4: Maîtrise en situation complexe
    {
      name: "Conduite sur autoroute",
      description: "Entrer, circuler et sortir correctement de l'autoroute.",
      phase: "PHASE4" as LearningPhase,
      category: "TRAFFIC_RULES" as CompetencyCategory,
      order: 1,
      officialCode: "P4C1",
    },
    {
      name: "Dépassement sécurisé",
      description: "Effectuer un dépassement en toute sécurité.",
      phase: "PHASE4" as LearningPhase,
      category: "RISK_PERCEPTION" as CompetencyCategory,
      order: 2,
      officialCode: "P4C2",
    },

    // Phase 5: Conduite influencée par facteurs externes
    {
      name: "Conduite de nuit",
      description: "Adapter sa conduite aux conditions nocturnes.",
      phase: "PHASE5" as LearningPhase,
      category: "SPECIAL_CONDITIONS" as CompetencyCategory,
      order: 1,
      officialCode: "P5C1",
    },
    {
      name: "Conduite sous la pluie",
      description: "Adapter sa conduite aux conditions pluvieuses.",
      phase: "PHASE5" as LearningPhase,
      category: "SPECIAL_CONDITIONS" as CompetencyCategory,
      order: 2,
      officialCode: "P5C2",
    },
  ];

  // Create competencies
  for (const competency of competencies) {
    await prisma.competency.upsert({
      where: { id: competency.officialCode },
      update: competency,
      create: {
        ...competency,
        id: competency.officialCode,
      },
    });
  }

  console.log(`✅ Created ${competencies.length} competencies`);

  // Create competency progress for each roadbook
  const roadbooks = await prisma.roadBook.findMany();
  const createdCompetencies = await prisma.competency.findMany();

  for (const roadbook of roadbooks) {
    for (const competency of createdCompetencies) {
      // Determine random status based on competency phase
      let status: CompetencyStatus;
      if (competency.phase === "PHASE1" || competency.phase === "PHASE2") {
        status = Math.random() > 0.3 ? "MASTERED" : "IN_PROGRESS";
      } else if (competency.phase === "PHASE3") {
        status = Math.random() > 0.5 ? "IN_PROGRESS" : "NOT_STARTED";
      } else {
        status = Math.random() > 0.7 ? "IN_PROGRESS" : "NOT_STARTED";
      }

      // Create progress record
      await prisma.competencyProgress.upsert({
        where: {
          roadbookId_competencyId: {
            roadbookId: roadbook.id,
            competencyId: competency.id,
          },
        },
        update: {
          status,
          lastPracticed:
            status !== "NOT_STARTED"
              ? new Date(
                  Date.now() -
                    Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
                )
              : null,
          notes:
            status === "MASTERED"
              ? "Compétence acquise"
              : status === "IN_PROGRESS"
              ? "En cours d'apprentissage"
              : null,
        },
        create: {
          roadbookId: roadbook.id,
          competencyId: competency.id,
          apprenticeId: roadbook.apprenticeId,
          status,
          lastPracticed:
            status !== "NOT_STARTED"
              ? new Date(
                  Date.now() -
                    Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
                )
              : null,
          notes:
            status === "MASTERED"
              ? "Compétence acquise"
              : status === "IN_PROGRESS"
              ? "En cours d'apprentissage"
              : null,
        },
      });
    }
  }

  // Create some competency validations for sessions
  const sessions = await prisma.session.findMany({
    where: { validationDate: { not: null } },
    include: { roadbook: true },
  });

  for (const session of sessions) {
    // Get 1-3 random competencies to validate in this session
    const competenciesToValidate = getRandomSubset(
      createdCompetencies.filter(
        (c) => c.phase === "PHASE1" || c.phase === "PHASE2"
      ),
      Math.floor(Math.random() * 3) + 1
    );

    for (const competency of competenciesToValidate) {
      await prisma.competencyValidation.create({
        data: {
          sessionId: session.id,
          competencyId: competency.id,
          validated: true,
          validatorId: session.validatorId || session.roadbook.guideId,
          notes:
            Math.random() > 0.5 ? "Bonne maîtrise de cette compétence" : null,
        },
      });
    }
  }

  console.log("✅ Created competency progress records and validations");
  return createdCompetencies;
}

// Helper function to get random subset of an array
function getRandomSubset<T>(array: T[], size: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}
