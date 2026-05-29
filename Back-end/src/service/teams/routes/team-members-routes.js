import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getTeamMembersById,
  deleteTeamMembersById,
  inviteTeamMember,
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
router.post(
  "/businesses/:businessId/members/invite",
  authenticateToken,
  inviteTeamMember,
);

export default router;
