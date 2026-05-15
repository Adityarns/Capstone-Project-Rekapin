import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getBusinessById,
  editBusinessById,
} from "../controller/business-controller.js";
import { editBusinessPayloadSchema } from "../validator/businesses-validator.js";

const router = express.Router();

router.get("/businesses/:businessId", getBusinessById);
router.put(
  "/businesses/:businessId",
  validate(editBusinessPayloadSchema),
  editBusinessById,
);

export default router;
