import express from "express";
import { editUserById, getUserById } from "../controller/users-controller.js";
import validate from "../../../middlewares/validator.js";
import { userUpdatePayloadSchema } from "../validator/users-validator.js";
import authenticateToken from "../../../middlewares/auth.js";

const router = express.Router();

router.get("/users/:userId", authenticateToken, getUserById);
router.put("/users/:userId", authenticateToken, validate(userUpdatePayloadSchema), editUserById);

export default router;
