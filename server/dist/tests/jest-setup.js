"use strict";
/**
 * Configuration globale pour les tests Jest
 * =========================================
 *
 * Ce fichier est chargé avant l'exécution de tous les tests et fournit
 * une configuration globale pour l'environnement de test Jest.
 *
 * Fonctionnalités:
 * - Amélioration des types Jest pour les mocks
 * - Configuration du mock global de fetch
 * - Résolution des problèmes courants de typage en tests
 *
 * @module tests/jest-setup
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Add patch for TypeScript to improve mock typing
// This will make TypeScript accept any value for mockResolvedValue, mockImplementation, etc.
const originalMockImplementation = globals_1.jest.fn().mockImplementation;
const originalMockResolvedValue = globals_1.jest.fn().mockResolvedValue;
const originalMockRejectedValue = globals_1.jest.fn().mockRejectedValue;
const originalMockReturnValue = globals_1.jest.fn().mockReturnValue;
// Extend Jest's mock types to prevent TypeScript errors with any value
// This is necessary because TypeScript is strict about the types used with mock functions
globals_1.jest.fn().mockImplementation = function (fn) {
    return originalMockImplementation.call(this, fn);
};
globals_1.jest.fn().mockResolvedValue = function (value) {
    return originalMockResolvedValue.call(this, value);
};
globals_1.jest.fn().mockRejectedValue = function (value) {
    return originalMockRejectedValue.call(this, value);
};
globals_1.jest.fn().mockReturnValue = function (value) {
    return originalMockReturnValue.call(this, value);
};
// Mock global.fetch if needed
if (!global.fetch) {
    global.fetch = globals_1.jest.fn().mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
    }));
}
// Log setup completion
console.log('Jest setup complete - Mock typing improved');
