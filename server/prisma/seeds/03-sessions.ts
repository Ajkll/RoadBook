// prisma/seeds/03-sessions.ts
import {
  PrismaClient,
  WeatherCondition,
  DaylightCondition,
} from "@prisma/client";

export async function seedSessions(prisma: PrismaClient) {
  console.log("Seeding sessions...");

  // Get roadbooks and users for relationships
  const roadbooks = await prisma.roadBook.findMany({
    include: { apprentice: true, guide: true },
  });

  if (roadbooks.length === 0) {
    console.warn("⚠️ No roadbooks found. Skipping session seeding.");
    return [];
  }

  // Generate sessions for each roadbook
  const sessions = [];

  for (const roadbook of roadbooks) {
    // Create 5 sessions for each roadbook with different dates
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - i * 3); // Every 3 days in the past

      const startTime = new Date(sessionDate);
      startTime.setHours(14 + i, 0, 0); // Different times

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1, 30, 0); // 1.5 hours later

      const session = {
        roadbookId: roadbook.id,
        date: sessionDate,
        startTime,
        endTime,
        duration: 90, // 1.5 hours in minutes
        startLocation: "Rue de la Station 1, 1300 Wavre",
        endLocation: "Avenue des Combattants 10, 1340 Ottignies",
        distance: 12.5 + i * 2, // Different distances
        routeData: {
          waypoints: [
            { lat: 50.7167, lng: 4.6, name: "Wavre" },
            { lat: 50.6667, lng: 4.5667, name: "Ottignies" },
          ],
        },
        weather: getRandomEnum(WeatherCondition),
        daylight:
          i < 3 ? ("DAY" as DaylightCondition) : ("NIGHT" as DaylightCondition),
        roadTypes: ["URBAN", "RURAL", "HIGHWAY"],
        notes: `Session ${i + 1} : ${
          i < 3 ? "Très bon progrès" : "Quelques difficultés avec les manœuvres"
        }`,
        apprenticeId: roadbook.apprenticeId,
        validatorId: roadbook.guideId,
        validationDate: i < 4 ? sessionDate : null, // Last session not validated yet
      };

      sessions.push(session);
    }
  }

  const createdSessions = [];
  for (const session of sessions) {
    const created = await prisma.session.create({
      data: session,
    });
    createdSessions.push(created);
  }

  console.log(`✅ Created ${createdSessions.length} sessions`);
  return createdSessions;
}

// Helper function to get random enum value
function getRandomEnum<T>(enumObject: T): T[keyof T] {
  const values = Object.values(enumObject as object) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}
