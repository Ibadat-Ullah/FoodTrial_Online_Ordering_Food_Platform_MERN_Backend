import { Router } from "express";
import riderController from "../controllers/riderController.js";

const router = Router();

router.route("/").get(riderController.list).post(riderController.create);
router
  .route("/:id")
  .get(riderController.get)
  .patch(riderController.update)
  .delete(riderController.remove);

export default router;
