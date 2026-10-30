import { Router } from "express";
import { seedCategories } from "../data/seedProducts.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.get("/", (_req, res) => {
  sendSuccess(res, seedCategories);
});

export default router;
