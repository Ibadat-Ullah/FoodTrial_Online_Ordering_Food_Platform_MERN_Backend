import { Router } from "express";
import riderController from "../controllers/riderController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.route("/").get(riderController.list).post(upload.single("profileImage"), riderController.create);
router
  .route("/:id")
  .get(riderController.get)
  .patch(upload.single("profileImage"), riderController.update)
  .delete(riderController.remove);

export default router;
