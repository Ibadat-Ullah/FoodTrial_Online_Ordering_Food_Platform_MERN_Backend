import "dotenv/config";
import mongoose from "mongoose";

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodtrial";

export default () =>
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
