import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    orderType: {
      type: String,
      enum: ["dine-in", "take-away"],
      default: "dine-in",
    },
    paymentMethod: {
      type: String,
      enum: ["qris", "cash"],
      default: "qris",
    },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ready", "completed", "cancelled"],
      default: "pending",
    },
    tableNumber: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export function formatOrder(doc) {
  if (!doc) return null;
  const order = doc.toObject ? doc.toObject() : doc;
  return {
    id: order._id.toString(),
    userId: order.user ? order.user.toString() : null,
    customerName: order.customerName,
    phone: order.phone,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    items: order.items,
    total: order.total,
    status: order.status,
    tableNumber: order.tableNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export const Order = mongoose.model("Order", orderSchema);
