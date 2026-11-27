import mongoose from "mongoose";

const orderAddOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0.01 },
    toppingOptions: { type: [orderAddOnSchema], default: [] },
    addOns: { type: [orderAddOnSchema], default: [] },
    quantity: { type: Number, required: true, min: 1, max: 50 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (items) => items.length > 0 && items.length <= 50,
    },
    delivery: {
      name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      address: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    },
    total: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
