import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware pour vérifier le JWT
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Récupérer le token d'autorisation
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Accès non autorisé - token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Accès interdit - token invalide" });
  }
};

// Middleware pour vérifier les rôles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Accès non autorisé - utilisateur non authentifié" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Accès interdit - privilèges insuffisants" });
    }

    next();
  };
};
