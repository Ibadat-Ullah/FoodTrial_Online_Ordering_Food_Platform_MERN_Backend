import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import multer from "multer";
import { fileURLToPath } from "node:url";

export const uploadsDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));
mkdirSync(uploadsDirectory, { recursive: true });

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
