// prisma/seeds/01-users.ts
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  console.log("Seeding users...");

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // Create different types of users
  const users = [
    // Demo test users (always available)
    {
      email: "user@roadbook.com",
      passwordHash: defaultPassword,
      displayName: "Demo User",
      firstName: "Demo",
      lastName: "User",
      nationalRegisterNumber: "99.01.01-111.11",
      birthDate: new Date("1999-01-01"),
      phoneNumber: "+32470000000",
      role: "APPRENTICE" as UserRole,
      bio: "Compte de démonstration pour tester l'application en tant qu'apprenti.",
    },
    {
      email: "guide@roadbook.com",
      passwordHash: defaultPassword,
      displayName: "Demo Guide",
      firstName: "Guide",
      lastName: "Demo",
      nationalRegisterNumber: "80.01.01-222.22",
      birthDate: new Date("1980-01-01"),
      phoneNumber: "+32471111111",
      role: "GUIDE" as UserRole,
      bio: "Compte de démonstration pour tester l'application en tant que guide.",
    },
    {
      email: "admin@roadbook.com",
      passwordHash: defaultPassword,
      displayName: "Admin",
      firstName: "Admin",
      lastName: "User",
      nationalRegisterNumber: "75.01.01-333.33",
      birthDate: new Date("1975-01-01"),
      phoneNumber: "+32472222222",
      role: "ADMIN" as UserRole,
      bio: "Compte administrateur pour tester toutes les fonctionnalités.",
    },
    
    // Apprentices
    {
      email: "paul.dupont@example.com",
      passwordHash: defaultPassword,
      displayName: "Paul",
      firstName: "Paul",
      lastName: "Dupont",
      nationalRegisterNumber: "01.02.03-123.45",
      birthDate: new Date("2003-02-01"),
      phoneNumber: "+32470123456",
      role: "APPRENTICE" as UserRole,
      bio: "Étudiant en informatique, passionné de technologie.",
    },
    {
      email: "sophie.martin@example.com",
      passwordHash: defaultPassword,
      displayName: "Sophie",
      firstName: "Sophie",
      lastName: "Martin",
      nationalRegisterNumber: "02.05.04-234.56",
      birthDate: new Date("2004-05-02"),
      phoneNumber: "+32471234567",
      role: "APPRENTICE" as UserRole,
      bio: "Étudiante en médecine, j'aime voyager et découvrir de nouveaux endroits.",
    },

    // Guides
    {
      email: "marie.dubois@example.com",
      passwordHash: defaultPassword,
      displayName: "Marie",
      firstName: "Marie",
      lastName: "Dubois",
      nationalRegisterNumber: "75.08.12-345.67",
      birthDate: new Date("1975-08-12"),
      phoneNumber: "+32472345678",
      role: "GUIDE" as UserRole,
      bio: "Mère de Paul, je l'accompagne dans son apprentissage de la conduite.",
    },
    {
      email: "pierre.leroy@example.com",
      passwordHash: defaultPassword,
      displayName: "Pierre",
      firstName: "Pierre",
      lastName: "Leroy",
      nationalRegisterNumber: "80.11.23-456.78",
      birthDate: new Date("1980-11-23"),
      phoneNumber: "+32473456789",
      role: "GUIDE" as UserRole,
      bio: "Père de Sophie, conducteur depuis 20 ans.",
    },

    // Instructors
    {
      email: "jean.lambert@auto-ecole.be",
      passwordHash: defaultPassword,
      displayName: "Jean",
      firstName: "Jean",
      lastName: "Lambert",
      nationalRegisterNumber: "67.04.15-567.89",
      birthDate: new Date("1967-04-15"),
      phoneNumber: "+32474567890",
      role: "INSTRUCTOR" as UserRole,
      bio: "Moniteur d'auto-école depuis 15 ans, spécialisé dans la conduite défensive.",
    },

    // Admin
    {
      email: "admin@roadbook.be",
      passwordHash: defaultPassword,
      displayName: "Admin RB",
      firstName: "Admin",
      lastName: "Système",
      nationalRegisterNumber: "85.07.20-678.90",
      birthDate: new Date("1985-07-20"),
      phoneNumber: "+32475678901",
      role: "ADMIN" as UserRole,
      bio: "Administrateur du système RoadBook.",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  console.log(`✅ Created ${users.length} users`);
  return prisma.user.findMany(); // Return all users for use in other seeds
}
