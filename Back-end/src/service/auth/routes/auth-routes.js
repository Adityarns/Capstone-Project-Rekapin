import { Router } from "express";
import validate from "../../../middlewares/validator.js";
import {
  postAuthenticationPayloadSchema,
  putAuthenticationPayloadSchema,
  deleteAuthenticationSchema,
} from "../validator/auth-schema.js";
import authenticateToken from "../../../middlewares/auth.js";
import { login, refreshToken, logout } from "../controller/auth-controller.js";

const router = Router();

router.post(
  "/authentications",
  validate(postAuthenticationPayloadSchema),
  login,
);
router.put(
  "/authentications",
  validate(putAuthenticationPayloadSchema),
  refreshToken,
);
router.delete("/authentications", validate(deleteAuthenticationSchema), logout);

export default router;
