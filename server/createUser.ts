// Script to create a test user in the database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const password = 'Password123!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Creating test user in database');
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash: passwordHash,
        role: 'APPRENTICE'
      }
    });
    
    console.log('Test user created successfully:', user);
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    
    // If user already exists, try to fetch it
    if (error.code === 'P2002') {
      console.log('User may already exist, trying to fetch it');
      const existingUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      if (existingUser) {
        console.log('Found existing user:', existingUser);
        return existingUser;
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser()
  .then(user => console.log('Operation completed for user:', user.email))
  .catch(e => console.error('Script failed:', e));