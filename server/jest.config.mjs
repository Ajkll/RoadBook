/* eslint-env node */
// jest.config.js - Convert to ESM or add proper ESLint configuration
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
};