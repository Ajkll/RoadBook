/* eslint-env node */
export default {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*))',
  ],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  verbose: false,
  reporters: [
    'default',
    ['jest-summary-reporter', {
      failuresOnly: false,
      includeConsoleLog: false, // Ne pas afficher les logs console
    }]
  ],
  setupFiles: [
    './jest.setup.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/index.js',
    '!**/app.config.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 0, //Nous avons des standarts très élevé
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
}