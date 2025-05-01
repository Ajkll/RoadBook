"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDatabase = exports.teardown = exports.setup = void 0;
const testcontainers_1 = require("testcontainers");
const child_process_1 = require("child_process");
const dotenv = __importStar(require("dotenv"));
const client_1 = require("@prisma/client");
// Load test environment variables
dotenv.config({ path: '.env.test' });
// Store container reference for cleanup
let container;
// Global setup function
const setup = async () => {
    console.log('Starting test environment with testcontainers...');
    try {
        // Start postgres container
        container = await new testcontainers_1.GenericContainer('postgres:14')
            .withExposedPorts(5432)
            .withEnvironment({
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: 'postgres',
            POSTGRES_DB: 'roadbook_test',
        })
            .withWaitStrategy(testcontainers_1.Wait.forLogMessage('database system is ready to accept connections'))
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
        (0, child_process_1.execSync)('npx prisma generate', { stdio: 'inherit' });
        // Push schema to the test database
        (0, child_process_1.execSync)('npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma', {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'test' }
        });
        console.log('Test database initialized successfully');
    }
    catch (error) {
        console.error('Error setting up test environment:', error);
        throw error;
    }
};
exports.setup = setup;
// Global teardown function
const teardown = async () => {
    console.log('Cleaning up test environment...');
    try {
        // Stop postgres container if it exists
        if (container) {
            await container.stop();
            console.log('Test container stopped');
        }
    }
    catch (error) {
        console.error('Error during test cleanup:', error);
    }
};
exports.teardown = teardown;
// Export a function to reset the database between tests
const resetDatabase = async () => {
    const prisma = new client_1.PrismaClient({
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
        const tables = await prisma.$queryRaw `
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
        // Disable triggers
        await prisma.$executeRaw `SET session_replication_role = 'replica'`;
        // Truncate all tables
        for (const { tablename } of tables) {
            if (tablename !== '_prisma_migrations') {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
            }
        }
        // Re-enable triggers
        await prisma.$executeRaw `SET session_replication_role = 'origin'`;
        console.log('Database reset complete');
    }
    catch (error) {
        console.error('Error resetting database:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.resetDatabase = resetDatabase;
