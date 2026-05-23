import { Router } from "express";
import validate from "../../../middlewares/validator.js";
import {
  registerAuthPayloadSchema,
  loginAuthPayloadSchema,
  refreshAuthPayloadSchema,
  logoutAuthPayloadSchema,
} from "../validator/auth-schema.js";
import authenticateToken from "../../../middlewares/auth.js";
import {
  login,
  refreshToken,
  logout,
  register,
} from "../controller/auth-controller.js";

const router = Router();
router.post("/auth/register", validate(registerAuthPayloadSchema), register);
router.post("/auth/login", validate(loginAuthPayloadSchema), login);
router.put(
  "/auth/refresh",
  authenticateToken,
  validate(refreshAuthPayloadSchema),
  refreshToken,
);
router.delete(
  "/auth/logout",
  authenticateToken,
  validate(logoutAuthPayloadSchema),
  logout,
);

export default router;
