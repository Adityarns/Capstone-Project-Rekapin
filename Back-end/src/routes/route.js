import { Router } from "express";
import users from "../service/users/routes/users-route.js";
import authentications from "../service/auth/routes/auth-routes.js";
const router = Router();

router.use("/", users);
router.use("/", authentications);

export default router;
