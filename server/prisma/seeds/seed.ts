import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create test users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // List of users to create
  const users = [
    {
      email: 'admin@roadbook.com',
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as UserRole,
      bio: 'System administrator',
    },
    {
      email: 'apprentice@roadbook.com',
      displayName: 'Learning Driver',
      firstName: 'Learning',
      lastName: 'Driver',
      role: 'APPRENTICE' as UserRole,
      bio: 'Learning to drive',
    },
    {
      email: 'guide@roadbook.com',
      displayName: 'Driving Guide',
      firstName: 'Driving',
      lastName: 'Guide',
      role: 'GUIDE' as UserRole,
      bio: 'Experienced driver helping others',
    },
    {
      email: 'instructor@roadbook.com',
      displayName: 'Professional Instructor',
      firstName: 'Pro',
      lastName: 'Instructor',
      role: 'INSTRUCTOR' as UserRole,
      bio: 'Professional driving instructor',
    }
  ];

  // Create all users
  const createdUsers: Record<string, any> = {};
  
  for (const userData of users) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`User ${userData.email} already exists, skipping...`);
      createdUsers[userData.role] = existingUser;
    } else {
      // Create user
      const user = await prisma.user.create({
        data: {
          ...userData,
          passwordHash
        }
      });
      console.log(`Created ${userData.role} user: ${user.email}, ${user.id}`);
      createdUsers[userData.role] = user;
    }
  }

  // Create roadbooks if apprentice and guide exist
  if (createdUsers.APPRENTICE && createdUsers.GUIDE) {
    const existingRoadbook = await prisma.roadBook.findFirst({
      where: {
        apprenticeId: createdUsers.APPRENTICE.id,
        guideId: createdUsers.GUIDE.id
      }
    });

    if (!existingRoadbook) {
      const roadbook = await prisma.roadBook.create({
        data: {
          title: 'My First Driving Journey',
          description: 'Learning the basics of driving',
          apprenticeId: createdUsers.APPRENTICE.id,
          guideId: createdUsers.GUIDE.id,
          targetHours: 30,
        }
      });
      console.log(`Created roadbook: ${roadbook.title}, ${roadbook.id}`);
    } else {
      console.log('Roadbook already exists, skipping...');
    }
  }

  // Create roadbooks if apprentice and instructor exist
  if (createdUsers.APPRENTICE && createdUsers.INSTRUCTOR) {
    const existingRoadbook = await prisma.roadBook.findFirst({
      where: {
        apprenticeId: createdUsers.APPRENTICE.id,
        guideId: createdUsers.INSTRUCTOR.id
      }
    });

    if (!existingRoadbook) {
      const roadbook = await prisma.roadBook.create({
        data: {
          title: 'Professional Training',
          description: 'Learning with a professional instructor',
          apprenticeId: createdUsers.APPRENTICE.id,
          guideId: createdUsers.INSTRUCTOR.id,
          targetHours: 20,
        }
      });
      console.log(`Created roadbook: ${roadbook.title}, ${roadbook.id}`);
    } else {
      console.log('Roadbook already exists, skipping...');
    }
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });