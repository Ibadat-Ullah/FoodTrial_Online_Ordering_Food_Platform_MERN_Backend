import { Router } from "express";
import { list } from "../controllers/userController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = Router();

router.get("/", authenticate, authorize("admin"), list);

export default router;
