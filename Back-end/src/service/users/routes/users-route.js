import express from "express";
import { getUserById } from "../controller/users-controller.js";
import validate from "../../../middlewares/validator.js";
import { register } from "../../auth/controller/auth-controller.js";
import { userPayloadSchema } from "../validator/users-validator.js";

const router = express.Router();

router.post("/users", validate(userPayloadSchema), register);
router.get("/users/:id", getUserById);

export default router;
