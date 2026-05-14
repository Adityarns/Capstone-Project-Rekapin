import { Router } from "express";
import users from "../service/users/routes/users-route.js";
import authentications from "../service/auth/routes/auth-routes.js";
import businesses from "../service/businesses/routes/businesses-route.js";
import teams from "../service/teams/routes/team-members-routes.js";
const router = Router();

router.use("/", users);
router.use("/", authentications);
router.use("/", businesses);
router.use("/", teams);

export default router;
