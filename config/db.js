import mongoose from "mongoose";

let connectionPromise;

export default function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error("Set MONGODB_URI in the backend environment."));
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: "foodtrial",
        serverSelectionTimeoutMS: 5000,
      })
      .then(() => mongoose.connection)
      .finally(() => {
        connectionPromise = null;
      });
  }
  return connectionPromise;
}
