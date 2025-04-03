import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Définir le token dans un cookie httpOnly pour plus de sécurité
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Déconnexion réussie" });
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token manquant" });
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    next(error);
  }
};
