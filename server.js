import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";
import ensureDatabase from "./middleware/ensureDatabase.js";
import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const origins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", ensureDatabase);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 }),
);

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/riders", authenticate, authorize("admin"), riderRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image must be 4 MB or smaller." });
  }
  if (error.code === "INVALID_IMAGE_TYPE") {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) {
    const message = error.keyPattern?.role
      ? "Admin setup has already been used."
      : "Email already exists.";
    return res.status(409).json({ message });
  }
  if (
    error.status === 400 ||
    error.type === "entity.parse.failed" ||
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({ message: "Invalid request data." });
  }
  return res.status(500).json({ message: "Server error." });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set a random JWT_SECRET of at least 32 characters.");
}

export { app };
export default app;
