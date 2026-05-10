import express from "express";
import { CreateUser, getUserById } from "../controller/users-controller.js";
import validate from "../../../middlewares/validator.js";
import { userPayloadSchema } from "../validator/users-validator.js";

const router = express.Router();

router.post("/users", validate(userPayloadSchema), CreateUser);
router.get("/users/:id", getUserById);

export default router;
