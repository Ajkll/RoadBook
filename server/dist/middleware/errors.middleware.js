"use strict";
/**
 * ERROR MIDDLEWARE
 *
 * Ce fichier contient des middlewares pour la gestion des erreurs:
 * - notFoundHandler: Gère les requêtes vers des routes inexistantes (404)
 * - errorHandler: Middleware global de gestion d'erreurs
 *
 * Ces middlewares permettent une gestion centralisée des erreurs avec des réponses
 * formatées de manière cohérente pour toutes les routes de l'API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = void 0;
/**
 * Not found handler middleware
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        status: "error",
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error("Error caught by error handler:", err);
    // Default status code is 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;
    // Default error message
    const message = err.message || "Internal server error";
    // Prepare error response
    const errorResponse = {
        status: "error",
        message,
        ...(process.env.NODE_ENV !== "production" && {
            stack: err.stack,
            data: err.data
        })
    };
    // Send error response
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
