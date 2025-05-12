/**
 * Logger selection based on environment
 * 
 * This file selects the appropriate logger implementation:
 * - vercel-logger for Vercel/serverless environments
 * - Regular winston logger for other environments
 */

import vercelLogger from './vercel-logger';

// Detect Vercel environment
const isVercel = process.env.VERCEL === '1';

// If in Vercel, export the simplified logger
// This avoids any file system operations
export default isVercel 
  ? vercelLogger
  : require('./logger').default;