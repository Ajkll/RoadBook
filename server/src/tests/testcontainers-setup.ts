import { GenericContainer, Wait } from 'testcontainers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Store container reference for cleanup
let container: any;

// Global setup function
export const setup = async (): Promise<void> => {
  console.log('Starting test environment with testcontainers...');
  
  try {
    // Start postgres container
    container = await new GenericContainer('postgres:14')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'roadbook_test',
      })
      .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
      .start();
    
    // Get container info
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    
    // Set dynamic database URL for tests
    process.env.DATABASE_URL = `postgresql://postgres:postgres@${host}:${port}/roadbook_test`;
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
    
    console.log(`PostgreSQL test container started at ${host}:${port}`);
    
    // Initialize database
    console.log('Initializing test database...');
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to the test database
    execSync('npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    console.log('Test database initialized successfully');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};

// Global teardown function
export const teardown = async (): Promise<void> => {
  console.log('Cleaning up test environment...');
  
  try {
    // Stop postgres container if it exists
    if (container) {
      await container.stop();
      console.log('Test container stopped');
    }
  } catch (error) {
    console.error('Error during test cleanup:', error);
  }
};

// Export a function to reset the database between tests
export const resetDatabase = async (): Promise<void> => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    // Connect to the database
    await prisma.$connect();
    
    // Get all tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    
    // Disable triggers
    await prisma.$executeRaw`SET session_replication_role = 'replica'`;
    
    // Truncate all tables
    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }
    
    // Re-enable triggers
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
    
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};