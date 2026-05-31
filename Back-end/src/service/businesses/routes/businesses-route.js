import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getBusinessById,
  editBusinessById,
  getAccessibleBusiness,
} from "../controller/business-controller.js";
import { editBusinessPayloadSchema } from "../validator/businesses-validator.js";
import AuthenticateToken from "../../../middlewares/auth.js";

const router = express.Router();

router.get("/businesses/:businessId", AuthenticateToken, getBusinessById);
router.get(
  "/businesses/access/:userId",
  AuthenticateToken,
  getAccessibleBusiness,
);
router.put(
  "/businesses/:businessId",
  AuthenticateToken,
  validate(editBusinessPayloadSchema),
  editBusinessById,
);

export default router;
