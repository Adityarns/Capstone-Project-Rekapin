import express from "express";
import {
  editUserById,
  getUserById,
  updateAvatar,
} from "../controller/users-controller.js";
import validate from "../../../middlewares/validator.js";
import { userUpdatePayloadSchema } from "../validator/users-validator.js";
import authenticateToken from "../../../middlewares/auth.js";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.get("/users/:userId", getUserById);
router.put(
  "/users/:userId",
  authenticateToken,
  validate(userUpdatePayloadSchema),
  editUserById,
);
router.patch(
  "/users/:userId/avatar",
  authenticateToken,
  upload.single("avatar"),
  updateAvatar,
);

export default router;
