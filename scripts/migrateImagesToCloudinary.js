import "dotenv/config";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { deleteImage, uploadImage } from "../config/cloudinary.js";
import Food from "../models/Food.js";
import Rider from "../models/Rider.js";

const uploadsDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));

async function migrateImages(Model, urlField, publicIdField, folder) {
  const records = await Model.find({ [urlField]: /^\/uploads\// });
  for (const record of records) {
    const filename = record[urlField].slice("/uploads/".length);
    if (basename(filename) !== filename) {
      throw new Error(`Invalid legacy upload path on ${Model.modelName} ${record.id}.`);
    }

    const buffer = await readFile(join(uploadsDirectory, filename));
    const uploaded = await uploadImage({ buffer }, folder);
    record[urlField] = uploaded.url;
    record[publicIdField] = uploaded.publicId;
    try {
      await record.save();
    } catch (error) {
      await deleteImage(uploaded.publicId);
      throw error;
    }
    console.log(`Migrated ${Model.modelName} image for record ${record.id}.`);
  }
}

try {
  await connectDB();
  await migrateImages(Food, "image", "imagePublicId", "foodtrial/foods");
  await migrateImages(Rider, "profileImage", "profileImagePublicId", "foodtrial/riders");
  console.log("Legacy image migration complete.");
} finally {
  await mongoose.disconnect();
}
