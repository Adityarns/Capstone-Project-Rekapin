import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getBusinessById,
  editBusinessById,
} from "../controller/business-controller.js";
import { editBusinessPayloadSchema } from "../validator/businesses-validator.js";
import AuthenticateToken from "../../../middlewares/auth.js";

const router = express.Router();

router.get("/businesses/:businessId", AuthenticateToken, getBusinessById);
router.put(
  "/businesses/:businessId",
  AuthenticateToken,
  validate(editBusinessPayloadSchema),
  editBusinessById,
);

export default router;
