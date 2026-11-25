import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authenticate from "./middleware/authenticate.js";
import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import riderRoutes from "./routes/riderRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const origins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 }),
);

app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/riders", authenticate, riderRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 11000) {
    return res.status(409).json({ message: "Email already exists." });
  }
  if (
    error.type === "entity.parse.failed" ||
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({ message: "Invalid request data." });
  }
  res.status(500).json({ message: "Server error." });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set a random JWT_SECRET of at least 32 characters in BackEnd/.env.");
}

connectDB()
  .then(() =>
    app.listen(port, () => console.log(`API running on port ${port}`)),
  )
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });
