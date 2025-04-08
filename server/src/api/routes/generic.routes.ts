/**
 * Generic CRUD Routes
 * This module provides a factory function that generates standard CRUD routes for any service
 */
import express, { Router } from 'express';
import { createCrudController } from '../../services/crud.service';
import * as authMiddleware from '../../middleware/auth.middleware';

/**
 * Creates a router with standard CRUD routes for a service
 * 
 * @param service The CRUD service to create routes for
 * @param options Options for configuring the routes
 * @returns Express router with CRUD routes
 */
export function createCrudRoutes(service: any, options: {
  basePath?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  customRoutes?: (router: Router) => void;
} = {}) {
  // Default options
  const {
    basePath = '',
    requireAuth = true,
    requireAdmin = false,
    customRoutes
  } = options;
  
  // Create controller from service
  const controller = createCrudController(service);
  
  // Create router
  const router = express.Router();
  
  // Apply auth middleware if required
  const authMiddlewares = [];
  if (requireAuth) {
    authMiddlewares.push(authMiddleware.authenticateJWT);
  }
  if (requireAdmin) {
    authMiddlewares.push(authMiddleware.requireAdmin);
  }
  
  // GET /:id - Get by ID
  router.get(
    `${basePath}/:id`,
    ...authMiddlewares,
    controller.getById
  );
  
  // GET / - Get many with filtering
  router.get(
    basePath,
    ...authMiddlewares,
    controller.getMany
  );
  
  // POST / - Create
  router.post(
    basePath,
    ...authMiddlewares,
    controller.create
  );
  
  // PUT /:id - Update
  router.put(
    `${basePath}/:id`,
    ...authMiddlewares,
    controller.update
  );
  
  // DELETE /:id - Delete
  router.delete(
    `${basePath}/:id`,
    ...authMiddlewares,
    controller.remove
  );
  
  // Apply custom routes if provided
  if (customRoutes) {
    customRoutes(router);
  }
  
  return router;
}