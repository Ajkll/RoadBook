import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";

export const createUser = async (
  req: Request,
  res: Response,
  NextFunction: NextFunction
) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      displayName: req.body.displayName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role || "APPRENTICE",
      nationalRegisterNumber: req.body.nationalRegisterNumber,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
    };

    const newUser = await userService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error: any) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  NextFunction: NextFunction
) => {
  try {
    // req.user est défini par le middleware authenticateJWT
    const user = await userService.getUserById(req.user.id);
    res.status(200).json(user);
  } catch (error: any) {
    next(error);
  }
};

// Ajoutez les autres méthodes (getAllUsers, getUserById, updateUser, etc.)
