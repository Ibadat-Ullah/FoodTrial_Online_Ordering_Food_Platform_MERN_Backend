import Food from "../models/Food.js";
import crudController from "./crudController.js";
import {
  removeUploadedImage,
  uploadedImagePath,
} from "../middleware/upload.js";

const crud = crudController(Food);
const listFields = ["ingredients", "allergens", "toppings"];

export function parsePricedOptions(value) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 20) {
    const error = new Error("A food item cannot have more than 20 options.");
    error.status = 400;
    throw error;
  }

  return lines.map((line) => {
    const separator = line.lastIndexOf(":");
    const name = line.slice(0, separator).trim();
    const priceText = line.slice(separator + 1).trim();
    const price = Number(priceText);
    if (
      separator < 1 ||
      !name ||
      name.length > 60 ||
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) ||
      !Number.isFinite(price) ||
      price > 100000
    ) {
      const error = new Error("Enter each option as `Name: price` on a separate line.");
      error.status = 400;
      throw error;
    }
    return { name, price };
  });
}

export function normalizeFoodFields(fields) {
  const normalized = { ...fields };
  for (const field of listFields) {
    if (typeof normalized[field] === "string") {
      normalized[field] = normalized[field]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }
  if (normalized.isAvailable === "true") normalized.isAvailable = true;
  if (normalized.isAvailable === "false") normalized.isAvailable = false;
  const clearAddOns = normalized.clearAddOns === true || normalized.clearAddOns === "true";
  const clearToppingOptions =
    normalized.clearToppingOptions === true || normalized.clearToppingOptions === "true";
  delete normalized.clearAddOns;
  delete normalized.clearToppingOptions;
  if (clearAddOns) {
    normalized.addOns = [];
  } else if (typeof normalized.addOns === "string") {
    normalized.addOns = parsePricedOptions(normalized.addOns);
  }
  if (clearToppingOptions) {
    normalized.toppingOptions = [];
  } else if (typeof normalized.toppingOptions === "string") {
    normalized.toppingOptions = parsePricedOptions(normalized.toppingOptions);
  }
  return normalized;
}

export default {
  ...crud,
  create: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Choose an image to upload." });
    }
    try {
      const food = await Food.create({
        ...normalizeFoodFields(req.body),
        image: uploadedImagePath(req.file),
      });
      return res.status(201).json(food);
    } catch (error) {
      await removeUploadedImage(uploadedImagePath(req.file));
      throw error;
    }
  },
  update: async (req, res) => {
    if (!req.file && !Object.keys(req.body || {}).length) {
      return res.status(400).json({ message: "Provide fields to update." });
    }
    const food = await Food.findById(req.params.id);
    if (!food) {
      if (req.file) await removeUploadedImage(uploadedImagePath(req.file));
      return res.status(404).json({ message: "Record not found." });
    }

    const oldImage = food.image;
    const fields = normalizeFoodFields(req.body || {});
    delete fields.image;
    Object.assign(food, fields);
    if (req.file) food.image = uploadedImagePath(req.file);
    try {
      await food.save();
    } catch (error) {
      if (req.file) await removeUploadedImage(uploadedImagePath(req.file));
      throw error;
    }
    if (req.file) await removeUploadedImage(oldImage);
    return res.json(food);
  },
  remove: async (req, res) => {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: "Record not found." });
    await removeUploadedImage(food.image);
    return res.json({ message: "Record deleted.", id: food.id });
  },
};
