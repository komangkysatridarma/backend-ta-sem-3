import { sendError } from "../utils/apiResponse.js";

export function notFoundHandler(_req, res) {
  sendError(res, "Endpoint tidak ditemukan", 404);
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, "Validasi gagal", 400, messages);
  }

  if (err.code === 11000) {
    return sendError(res, "Data duplikat (email atau productId sudah ada)", 409);
  }

  sendError(res, err.message || "Terjadi kesalahan server", err.status || 500);
}
