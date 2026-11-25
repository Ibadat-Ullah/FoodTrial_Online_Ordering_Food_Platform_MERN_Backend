import { Router } from "express";
import foodController from "../controllers/foodController.js";
import authenticate from "../middleware/authenticate.js";

const router = Router();

router
  .route("/")
  .get(foodController.list)
  .post(authenticate, foodController.create);
router
  .route("/:id")
  .get(foodController.get)
  .patch(authenticate, foodController.update)
  .delete(authenticate, foodController.remove);

export default router;
