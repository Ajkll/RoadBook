import express from "express";
import * as authController from "../../../controllers/auth.controller";
import { validateLogin } from "../../middleware/validation.middleware";

const router = express.Router();

router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

export default router;
