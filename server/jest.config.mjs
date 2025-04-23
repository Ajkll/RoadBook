/* eslint-env node */
// jest.config.js - Convert to ESM or add proper ESLint configuration
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest-setup.ts"],
  
  // Configure mocks that apply to all tests
  moduleNameMapper: {
    // Mock out the Prisma client in all tests
    "^../config/prisma$": "<rootDir>/src/tests/mocks/prisma.mock.ts",
  },
  
  // Allow Jest to ignore TypeScript type checking errors
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [2532, 2345, 2339, 2322, 2769, 2740]
      }
    }
  }
};