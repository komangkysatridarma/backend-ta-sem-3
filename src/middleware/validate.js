import { validationResult } from "express-validator";
import { sendError } from "../utils/apiResponse.js";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      "Validasi input gagal",
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
}
