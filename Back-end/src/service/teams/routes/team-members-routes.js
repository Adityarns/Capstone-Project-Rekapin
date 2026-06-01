import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getTeamMembersById,
  deleteTeamMembersById,
  inviteTeamMember,
  getTeamInvitations,
  rejectInvitation,
  acceptInvitation,
} from "../controller/team-member-controller.js";
import authenticateToken from "../../../middlewares/auth.js";
const router = express.Router();

router.get(
  "/businesses/:businessId/members",
  authenticateToken,
  getTeamMembersById,
);
router.get("/invitations", authenticateToken, getTeamInvitations);
router.post(
  "/invitations/:inviteCode/accept",
  authenticateToken,
  acceptInvitation,
);
router.delete("/invitations/:inviteCode", authenticateToken, rejectInvitation);

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
