import { Router } from "express";
import { body, param } from "express-validator";
import { Order, formatOrder } from "../models/Order.js";
import { Product } from "../models/Product.js";
import {
  adminRequired,
  authRequired,
  optionalAuth,
} from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const router = Router();

function computeTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

router.post(
  "/",
  optionalAuth,
  [
    body("customerName").trim().notEmpty().withMessage("Nama wajib diisi"),
    body("phone").trim().notEmpty().withMessage("Nomor telepon wajib diisi"),
    body("orderType")
      .optional()
      .isIn(["dine-in", "take-away"])
      .withMessage("orderType harus dine-in atau take-away"),
    body("paymentMethod")
      .optional()
      .isIn(["qris", "cash"])
      .withMessage("paymentMethod harus qris atau cash"),
    body("items").isArray({ min: 1 }).withMessage("Keranjang tidak boleh kosong"),
    body("items.*.id").isInt({ min: 1 }).withMessage("id item harus angka"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("quantity minimal 1"),
    body("total").optional().isInt({ min: 0 }),
    body("tableNumber").optional().trim(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const {
        customerName,
        phone,
        orderType = "dine-in",
        paymentMethod = "qris",
        items: rawItems,
        total: clientTotal,
        tableNumber = "",
      } = req.body;

      const normalizedItems = [];

      for (const line of rawItems) {
        const productId = line.id ?? line.productId;
        const product = await Product.findOne({
          productId,
          isAvailable: true,
        });
        if (!product) {
          return sendError(
            res,
            `Menu dengan id ${productId} tidak tersedia`,
            400
          );
        }

        normalizedItems.push({
          productId: product.productId,
          name: product.name,
          price: product.price,
          quantity: line.quantity,
          image: product.image,
        });
      }

      const total = computeTotal(normalizedItems);
      if (clientTotal !== undefined && clientTotal !== total) {
        return sendError(
          res,
          "Total pesanan tidak sesuai dengan item",
          400
        );
      }

      const order = await Order.create({
        user: req.auth?.userId ?? null,
        customerName,
        phone,
        orderType,
        paymentMethod,
        items: normalizedItems,
        total,
        tableNumber: orderType === "dine-in" ? tableNumber : "",
      });

      sendSuccess(res, formatOrder(order), 201);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.auth.userId }).sort({
      createdAt: -1,
    });
    sendSuccess(res, orders.map(formatOrder));
  } catch (err) {
    next(err);
  }
});

router.get("/", authRequired, adminRequired, async (_req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    sendSuccess(res, orders.map(formatOrder));
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  authRequired,
  [param("id").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return sendError(res, "Pesanan tidak ditemukan", 404);
      }

      const isOwner =
        order.user && order.user.toString() === req.auth.userId;
      const isAdmin = req.auth.role === "admin";
      if (!isOwner && !isAdmin) {
        return sendError(res, "Akses ditolak", 403);
      }

      sendSuccess(res, formatOrder(order));
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/status",
  authRequired,
  adminRequired,
  [
    param("id").isMongoId(),
    body("status")
      .isIn(["pending", "confirmed", "ready", "completed", "cancelled"])
      .withMessage("Status tidak valid"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!order) {
        return sendError(res, "Pesanan tidak ditemukan", 404);
      }
      sendSuccess(res, formatOrder(order));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
