import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, required: true, trim: true },
    deliveryZone: { type: String, trim: true, maxlength: 100, default: "" },
    profileImage: { type: String, trim: true, default: "" },
    profileImagePublicId: { type: String, trim: true, default: "" },
    vehicleType: {
      type: String,
      required: true,
      enum: ["bicycle", "motorcycle", "car"],
    },
    vehicleRegistration: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

export default mongoose.model("Rider", riderSchema);
