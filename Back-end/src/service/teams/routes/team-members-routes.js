import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getTeamMembersById,
  deleteTeamMembersById,
} from "../controller/team-member-controller.js";
import authenticateToken from "../../../middlewares/auth.js";
const router = express.Router();

router.get(
  "/businesses/:businessId/members",
  authenticateToken,
  getTeamMembersById,
);
router.delete(
  "/businesses/:businessId/members/:userId",
  authenticateToken,
  deleteTeamMembersById,
);

export default router;
