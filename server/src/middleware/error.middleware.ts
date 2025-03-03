import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error.message || "Something went wrong";

  logger.error(`Error ${statusCode}: ${message}`);

  if (res.headersSent) {
    return next(error);
  }

  // Sinon, terminez la réponse
  res.status(500).json({ message: "Une erreur est survenue" });

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
  });
};
