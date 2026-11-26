import { Router } from "express";
import foodController from "../controllers/foodController.js";
import authenticate from "../middleware/authenticate.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router
  .route("/")
  .get(foodController.list)
  .post(authenticate, upload.single("image"), foodController.create);
router
  .route("/:id")
  .get(foodController.get)
  .patch(authenticate, upload.single("image"), foodController.update)
  .delete(authenticate, foodController.remove);

export default router;
