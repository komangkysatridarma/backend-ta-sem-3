import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, "Token autentikasi diperlukan", 401);
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    return sendError(res, "Token tidak valid atau kedaluwarsa", 401);
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    req.auth = undefined;
  }
  next();
}

export function adminRequired(req, res, next) {
  if (req.auth?.role !== "admin") {
    return sendError(res, "Akses admin diperlukan", 403);
  }
  next();
}

export async function attachUser(req, _res, next) {
  if (!req.auth?.userId) return next();
  const user = await User.findById(req.auth.userId);
  if (user) req.user = user;
  next();
}
