import connectDB from "../config/db.js";

export default async function ensureDatabase(_req, res, next) {
  try {
    await connectDB();
    return next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.set("Retry-After", "5");
    return res.status(503).json({
      message: "Database unavailable. Check the backend database configuration.",
    });
  }
}
