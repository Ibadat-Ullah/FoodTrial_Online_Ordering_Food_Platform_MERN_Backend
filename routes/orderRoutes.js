import { Router } from "express";
import {
  create,
  listAll,
  listMine,
  updateStatus,
} from "../controllers/orderController.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const router = Router();

router.post("/", authenticate, authorize("customer"), create);
router.get("/mine", authenticate, authorize("customer"), listMine);
router.get("/", authenticate, authorize("admin"), listAll);
router.patch("/:id/status", authenticate, authorize("admin"), updateStatus);

export default router;
