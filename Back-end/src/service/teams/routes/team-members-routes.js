import express from "express";
import validate from "../../../middlewares/validator.js";
import {
  getTeamMembersById,
  deleteTeamMembersById,
} from "../controller/team-member-controller.js";

const router = express.Router();

router.get("/businesses/:businessId/members", getTeamMembersById);
router.delete("/businesses/:businessId/members/:userId", deleteTeamMembersById);

export default router;
