// Extend Jest Mock type to better handle mock functions with resolved values
import { jest } from '@jest/globals';

// Extend type for better mock resolver handling
export type ExtendedMockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T> & {
  mockResolvedValue: (value: any) => ExtendedMockFunction<T>;
  mockResolvedValueOnce: (value: any) => ExtendedMockFunction<T>;
  mockRejectedValue: (value: any) => ExtendedMockFunction<T>;
  mockRejectedValueOnce: (value: any) => ExtendedMockFunction<T>;
  mockImplementation: (fn: (...args: any[]) => any) => ExtendedMockFunction<T>;
  mockImplementationOnce: (fn: (...args: any[]) => any) => ExtendedMockFunction<T>;
};

/**
 * Creates an extended mock function that works better with TypeScript
 * by allowing any return value in mockResolvedValue and mockImplementation
 */
export const createMock = <T extends (...args: any[]) => any>(
  implementation?: (...args: Parameters<T>) => ReturnType<T>
): ExtendedMockFunction<T> => {
  return jest.fn(implementation) as unknown as ExtendedMockFunction<T>;
};

/**
 * Convert a Jest Mock to an Extended Mock with better TypeScript support
 */
export const asExtendedMock = <T extends (...args: any[]) => any>(
  mockFn: jest.MockedFunction<T>
): ExtendedMockFunction<T> => {
  return mockFn as unknown as ExtendedMockFunction<T>;
};