import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import connectDB from "./db.js";
import Food from "./schemas/foodSchema.js";
import Rider from "./schemas/riderSchema.js";

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

function addCrudRoutes(path, Model) {
  const url = `/api/${path}`;

  app.get(url, async (_req, res) =>
    res.json(await Model.find().sort({ createdAt: -1 }).lean()),
  );
  app.post(url, async (req, res) =>
    res.status(201).json(await Model.create(req.body)),
  );
  app.get(`${url}/:id`, async (req, res) => {
    const item = await Model.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Record not found." });
    res.json(item);
  });
  app.patch(`${url}/:id`, async (req, res) => {
    if (!req.body || !Object.keys(req.body).length) {
      return res.status(400).json({ message: "Provide fields to update." });
    }
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      strict: "throw",
    });
    if (!item) return res.status(404).json({ message: "Record not found." });
    res.json(item);
  });
  app.delete(`${url}/:id`, async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Record not found." });
    res.json({ message: "Record deleted.", id: item.id });
  });
}

addCrudRoutes("foods", Food);
addCrudRoutes("riders", Rider);

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

connectDB()
  .then(() => app.listen(port, () => console.log(`API running on port ${port}`)))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exitCode = 1;
  });
