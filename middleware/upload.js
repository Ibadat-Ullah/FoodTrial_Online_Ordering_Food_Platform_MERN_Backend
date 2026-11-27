import multer from "multer";

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    if (extensions[file.mimetype]) return done(null, true);
    const error = new Error("Choose a JPEG, PNG, or WebP image.");
    error.code = "INVALID_IMAGE_TYPE";
    return done(error);
  },
});
