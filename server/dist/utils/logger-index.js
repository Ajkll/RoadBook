"use strict";
/**
 * Logger selection based on environment
 *
 * This file selects the appropriate logger implementation:
 * - vercel-logger for Vercel/serverless environments
 * - Regular winston logger for other environments
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vercel_logger_1 = __importDefault(require("./vercel-logger"));
// Detect Vercel environment
const isVercel = process.env.VERCEL === '1';
// If in Vercel, export the simplified logger
// This avoids any file system operations
exports.default = isVercel
    ? vercel_logger_1.default
    : require('./logger').default;
