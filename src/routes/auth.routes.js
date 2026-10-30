import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { User, formatUser } from "../models/User.js";
import { authRequired, attachUser } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Nama wajib diisi"),
    body("email").isEmail().withMessage("Email tidak valid"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password minimal 6 karakter"),
    body("phone").optional().trim(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password, phone } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return sendError(res, "Email sudah terdaftar", 409);
      }

      const user = await User.create({
        name,
        email,
        password,
        phone: phone || "",
      });

      const token = signToken(user);
      sendSuccess(
        res,
        { token, user: formatUser(user) },
        201
      );
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email tidak valid"),
    body("password").notEmpty().withMessage("Password wajib diisi"),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );
      if (!user || !(await user.comparePassword(password))) {
        return sendError(res, "Email atau password salah", 401);
      }

      const token = signToken(user);
      sendSuccess(res, { token, user: formatUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", authRequired, attachUser, (req, res) => {
  if (!req.user) {
    return sendError(res, "Pengguna tidak ditemukan", 404);
  }
  sendSuccess(res, formatUser(req.user));
});

export default router;
