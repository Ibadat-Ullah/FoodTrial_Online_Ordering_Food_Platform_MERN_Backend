import mongoose from "mongoose";

const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://ibadat_ullah:1234@mern-cluster-1.uqzexrk.mongodb.net/";

export default function connectDB() {
  return mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
}
