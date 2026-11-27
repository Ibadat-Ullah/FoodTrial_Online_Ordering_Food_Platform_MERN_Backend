import { v2 as cloudinary } from "cloudinary";

function getCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Configure Cloudinary credentials before uploading images.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

export function uploadImage(file, folder) {
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary did not return an image URL."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(file.buffer);
  });
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  const result = await getCloudinary().uploader.destroy(publicId, {
    resource_type: "image",
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary could not delete image ${publicId}.`);
  }
}
