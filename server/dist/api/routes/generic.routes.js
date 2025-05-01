"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudRoutes = createCrudRoutes;
/**
 * Generic CRUD Routes
 * This module provides a factory function that generates standard CRUD routes for any service
 */
const express_1 = __importDefault(require("express"));
const crud_service_1 = require("../../services/crud.service");
const authMiddleware = __importStar(require("../../middleware/auth.middleware"));
/**
 * Creates a router with standard CRUD routes for a service
 *
 * @param service The CRUD service to create routes for
 * @param options Options for configuring the routes
 * @returns Express router with CRUD routes
 */
function createCrudRoutes(service, options = {}) {
    // Default options
    const { basePath = '', requireAuth = true, requireAdmin = false, customRoutes } = options;
    // Create controller from service
    const controller = (0, crud_service_1.createCrudController)(service);
    // Create router
    const router = express_1.default.Router();
    // Apply auth middleware if required
    const authMiddlewares = [];
    if (requireAuth) {
        authMiddlewares.push(authMiddleware.authenticate);
    }
    if (requireAdmin) {
        authMiddlewares.push(authMiddleware.authorizeAdmin);
    }
    // GET /:id - Get by ID
    router.get(`${basePath}/:id`, ...authMiddlewares, controller.getById);
    // GET / - Get many with filtering
    router.get(basePath, ...authMiddlewares, controller.getMany);
    // POST / - Create
    router.post(basePath, ...authMiddlewares, controller.create);
    // PUT /:id - Update
    router.put(`${basePath}/:id`, ...authMiddlewares, controller.update);
    // DELETE /:id - Delete
    router.delete(`${basePath}/:id`, ...authMiddlewares, controller.remove);
    // Apply custom routes if provided
    if (customRoutes) {
        customRoutes(router);
    }
    return router;
}
