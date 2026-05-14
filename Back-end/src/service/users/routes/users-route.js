import express from "express";
import { editUserById, getUserById } from "../controller/users-controller.js";
import validate from "../../../middlewares/validator.js";
import { userUpdatePayloadSchema } from "../validator/users-validator.js";

const router = express.Router();

router.get("/users/:userId", getUserById);
router.put("/users/:userId", validate(userUpdatePayloadSchema), editUserById);

export default router;
