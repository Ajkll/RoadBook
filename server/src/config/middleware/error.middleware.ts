import { Request, Response, NextFunction } from "express";

// Interface d'erreur avec code HTTP optionnel
interface AppError extends Error {
  statusCode?: number;
}

// Middleware de gestion d'erreur
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;

  // En développement, on renvoie plus de détails
  const response = {
    message: err.message || "Une erreur est survenue",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  console.error(
    `[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${err.message}`
  );
  res.status(statusCode).json(response);
};

// Middleware pour les routes non trouvées
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error: AppError = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
