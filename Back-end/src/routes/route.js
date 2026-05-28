import { Router } from "express";
import users from "../service/users/routes/users-route.js";
import authentications from "../service/auth/routes/auth-routes.js";
import businesses from "../service/businesses/routes/businesses-route.js";
import teams from "../service/teams/routes/team-members-routes.js";
import transactions from "../service/transaction/routes/transaction-route.js";
import carbon from "../service/carbon/routes/carbon-routes.js";
import reports from "../service/reports/routes/report-routes.js";
const router = Router();

router.use("/", users);
router.use("/", authentications);
router.use("/", businesses);
router.use("/", teams);
router.use("/", transactions);
router.use("/", carbon);
router.use("/", reports);

export default router;
