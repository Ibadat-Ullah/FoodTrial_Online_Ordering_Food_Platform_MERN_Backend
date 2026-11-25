import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

export default () => {
  if (!mongoUri) throw new Error("Set MONGODB_URI in BackEnd/.env.");
  return mongoose.connect(mongoUri, {
    dbName: "foodtrial",
    serverSelectionTimeoutMS: 5000,
  });
};
