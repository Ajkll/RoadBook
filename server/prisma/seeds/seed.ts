import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing data
  await prisma.user.deleteMany({});
  
  // Create users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash,
      displayName: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
      role: 'APPRENTICE'
    }
  });
  
  // Create demo guide
  const demoGuide = await prisma.user.create({
    data: {
      email: 'guide@example.com',
      passwordHash,
      displayName: 'Demo Guide',
      firstName: 'Guide',
      lastName: 'Demo',
      role: 'GUIDE'
    }
  });
  
  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });
  
  console.log({ demoUser, demoGuide, admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });