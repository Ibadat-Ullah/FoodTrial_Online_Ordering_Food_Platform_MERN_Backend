import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import multer from "multer";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

export const uploadsDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));
mkdirSync(uploadsDirectory, { recursive: true });

export const uploadedImagePath = (file) => `/uploads/${file.filename}`;

export async function removeUploadedImage(image) {
  if (!image?.startsWith("/uploads/")) return;
  const filename = image.slice("/uploads/".length);
  if (basename(filename) !== filename) return;
  try {
    await unlink(join(uploadsDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (_req, file, done) =>
    done(null, `${randomUUID()}${extensions[file.mimetype]}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    if (extensions[file.mimetype]) return done(null, true);
    const error = new Error("Choose a JPEG, PNG, or WebP image.");
    error.code = "INVALID_IMAGE_TYPE";
    return done(error);
  },
});
