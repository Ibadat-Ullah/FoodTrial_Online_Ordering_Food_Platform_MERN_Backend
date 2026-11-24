import { Router } from "express";
import foodController from "../controllers/foodController.js";

const router = Router();

router.route("/").get(foodController.list).post(foodController.create);
router
  .route("/:id")
  .get(foodController.get)
  .patch(foodController.update)
  .delete(foodController.remove);

export default router;
