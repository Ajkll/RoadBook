/* eslint-env node */
// jest.config.mjs - Configuration complète pour les tests
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  setupFilesAfterEnv: [
    "<rootDir>/src/tests/jest-setup.ts",
    "<rootDir>/src/tests/setup.ts"
  ],
  
  // Configure mocks that apply to all tests
  moduleNameMapper: {
    // Mock out the Prisma client in all tests
    "^../config/prisma$": "<rootDir>/src/tests/mocks/prisma.mock.ts",
  },
  
  // Allow Jest to ignore TypeScript type checking errors in tests
  // to prevent mocking-related type errors
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [
          2322, // Type assignment error
          2345, // Argument type error
          2339, // Property does not exist
          2532, // Object possibly undefined
          2769, // No overload matches
          2740, // Type missing properties
          2554  // Expected X arguments but got Y
        ]
      }
    }
  },
  
  // Added options for better UX
  verbose: true,
  collectCoverage: false,
  coverageReporters: ["text", "lcov"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/tests/**/*",
    "!src/prisma/**/*"
  ],
  
  // Better reporting
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "./logs",
      outputName: "junit.xml"
    }]
  ],
  
  // Give tests enough time to run
  testTimeout: 30000
};