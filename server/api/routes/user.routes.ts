import express from "express";
import * as userController from "../../controllers/user.controller";
import { validateUserCreation } from "../../middleware/validation.middleware";
import { authenticateJWT } from "../../middleware/auth.middleware";

const router = express.Router();

// Routes publiques
router.post("/", validateUserCreation, userController.createUser);

// Routes protégées (nécessitent authentification)
router.get("/me", authenticateJWT, userController.getCurrentUser);
router.put("/me", authenticateJWT, userController.updateCurrentUser);
router.delete("/me", authenticateJWT, userController.deleteCurrentUser);

// Routes administratives (nécessitent rôle ADMIN)
router.get("/", authenticateJWT, userController.getAllUsers);
router.get("/:id", authenticateJWT, userController.getUserById);
router.put("/:id", authenticateJWT, userController.updateUser);
router.delete("/:id", authenticateJWT, userController.deleteUser);

export default router;
