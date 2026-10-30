import { Router } from "express";
import { body, param } from "express-validator";
import { User, formatUser } from "../models/User.js";
import {
  adminRequired,
  authRequired,
  attachUser,
} from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const router = Router();

router.use(authRequired);

router.get("/", adminRequired, async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    sendSuccess(res, users.map(formatUser));
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id",
  [param("id").isMongoId()],
  validateRequest,
  attachUser,
  async (req, res, next) => {
    try {
      const isSelf = req.auth.userId === req.params.id;
      if (!isSelf && req.auth.role !== "admin") {
        return sendError(res, "Akses ditolak", 403);
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return sendError(res, "Pengguna tidak ditemukan", 404);
      }
      sendSuccess(res, formatUser(user));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  [
    param("id").isMongoId(),
    body("name").optional().trim().notEmpty(),
    body("phone").optional().trim(),
    body("role").optional().isIn(["customer", "admin"]),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const isSelf = req.auth.userId === req.params.id;
      if (!isSelf && req.auth.role !== "admin") {
        return sendError(res, "Akses ditolak", 403);
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.phone !== undefined) updates.phone = req.body.phone;
      if (req.auth.role === "admin" && req.body.role) {
        updates.role = req.body.role;
      }

      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });
      if (!user) {
        return sendError(res, "Pengguna tidak ditemukan", 404);
      }
      sendSuccess(res, formatUser(user));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  adminRequired,
  [param("id").isMongoId()],
  validateRequest,
  async (req, res, next) => {
    try {
      if (req.auth.userId === req.params.id) {
        return sendError(res, "Tidak dapat menghapus akun sendiri", 400);
      }
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return sendError(res, "Pengguna tidak ditemukan", 404);
      }
      sendSuccess(res, { message: "Pengguna dihapus", id: req.params.id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
