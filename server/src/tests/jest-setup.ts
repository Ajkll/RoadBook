// src/tests/jest-setup.ts
import { jest } from '@jest/globals';

/**
 * This file provides global setup for Jest tests
 * It's loaded before all tests run
 */

// Add patch for TypeScript to improve mock typing
// This will make TypeScript accept any value for mockResolvedValue, mockImplementation, etc.
const originalMockImplementation = jest.fn().mockImplementation;
const originalMockResolvedValue = jest.fn().mockResolvedValue;
const originalMockRejectedValue = jest.fn().mockRejectedValue;
const originalMockReturnValue = jest.fn().mockReturnValue;

// Extend Jest's mock types to prevent TypeScript errors with any value
// This is necessary because TypeScript is strict about the types used with mock functions
jest.fn().mockImplementation = function(fn: any) {
  return originalMockImplementation.call(this, fn);
};

jest.fn().mockResolvedValue = function(value: any) {
  return originalMockResolvedValue.call(this, value);
};

jest.fn().mockRejectedValue = function(value: any) {
  return originalMockRejectedValue.call(this, value);
};

jest.fn().mockReturnValue = function(value: any) {
  return originalMockReturnValue.call(this, value);
};

// Mock global.fetch if needed
if (!global.fetch) {
  global.fetch = jest.fn(() => 
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
    } as Response)
  ) as jest.Mock;
}

// Log setup completion
console.log('Jest setup complete - Mock typing improved');