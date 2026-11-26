import { unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import Food from "../models/Food.js";
import crudController from "./crudController.js";
import { uploadsDirectory } from "../middleware/upload.js";

const crud = crudController(Food);
const imagePath = (file) => `/uploads/${file.filename}`;

async function removeImage(image) {
  if (!image?.startsWith("/uploads/")) return;
  const filename = image.slice("/uploads/".length);
  if (basename(filename) !== filename) return;
  try {
    await unlink(join(uploadsDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export default {
  ...crud,
  create: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Choose an image to upload." });
    }
    try {
      const food = await Food.create({
        ...req.body,
        image: imagePath(req.file),
      });
      return res.status(201).json(food);
    } catch (error) {
      await removeImage(imagePath(req.file));
      throw error;
    }
  },
  update: async (req, res) => {
    if (!req.file && !Object.keys(req.body || {}).length) {
      return res.status(400).json({ message: "Provide fields to update." });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      if (req.file) await removeImage(imagePath(req.file));
      return res.status(404).json({ message: "Record not found." });
    }

    const oldImage = food.image;
    const fields = { ...(req.body || {}) };
    delete fields.image;
    Object.assign(food, fields);
    if (req.file) food.image = imagePath(req.file);
    try {
      await food.save();
    } catch (error) {
      if (req.file) await removeImage(imagePath(req.file));
      throw error;
    }
    if (req.file) await removeImage(oldImage);
    return res.json(food);
  },
  remove: async (req, res) => {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: "Record not found." });
    await removeImage(food.image);
    return res.json({ message: "Record deleted.", id: food.id });
  },
};
