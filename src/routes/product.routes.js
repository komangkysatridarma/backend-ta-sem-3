import { Router } from "express";
import { body, param, query } from "express-validator";
import { Product } from "../models/Product.js";
import {
  adminRequired,
  authRequired,
} from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { formatProduct, formatProducts } from "../utils/productFormatter.js";

const router = Router();

router.get(
  "/",
  [
    query("category").optional().trim(),
    query("search").optional().trim(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const filter = { isAvailable: true };
      const { category, search } = req.query;

      if (category && category !== "Semua") {
        filter.category = category;
      }

      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const products = await Product.find(filter).sort({ productId: 1 });
      sendSuccess(res, formatProducts(products));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("ID produk harus angka positif")],
  validateRequest,
  async (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const product = await Product.findOne({ productId });
      if (!product) {
        return sendError(res, "Menu tidak ditemukan", 404);
      }
      sendSuccess(res, formatProduct(product));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  authRequired,
  adminRequired,
  [
    body("productId").optional().isInt({ min: 1 }),
    body("name").trim().notEmpty(),
    body("category").trim().notEmpty(),
    body("price").isInt({ min: 0 }),
    body("image").trim().notEmpty(),
    body("description").trim().notEmpty(),
    body("isAvailable").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      let { productId } = req.body;
      if (!productId) {
        const last = await Product.findOne().sort({ productId: -1 });
        productId = last ? last.productId + 1 : 1;
      }

      const product = await Product.create({ ...req.body, productId });
      sendSuccess(res, formatProduct(product), 201);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  authRequired,
  adminRequired,
  [
    param("id").isInt({ min: 1 }),
    body("name").optional().trim().notEmpty(),
    body("category").optional().trim().notEmpty(),
    body("price").optional().isInt({ min: 0 }),
    body("image").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("isAvailable").optional().isBoolean(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const product = await Product.findOneAndUpdate(
        { productId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!product) {
        return sendError(res, "Menu tidak ditemukan", 404);
      }
      sendSuccess(res, formatProduct(product));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authRequired,
  adminRequired,
  [param("id").isInt({ min: 1 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const productId = Number(req.params.id);
      const product = await Product.findOneAndDelete({ productId });
      if (!product) {
        return sendError(res, "Menu tidak ditemukan", 404);
      }
      sendSuccess(res, { message: "Produk dihapus", id: productId });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
