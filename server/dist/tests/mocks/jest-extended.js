"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asExtendedMock = exports.createMock = void 0;
// Extend Jest Mock type to better handle mock functions with resolved values
const globals_1 = require("@jest/globals");
/**
 * Creates an extended mock function that works better with TypeScript
 * by allowing any return value in mockResolvedValue and mockImplementation
 */
const createMock = (implementation) => {
    return globals_1.jest.fn(implementation);
};
exports.createMock = createMock;
/**
 * Convert a Jest Mock to an Extended Mock with better TypeScript support
 */
const asExtendedMock = (mockFn) => {
    return mockFn;
};
exports.asExtendedMock = asExtendedMock;
