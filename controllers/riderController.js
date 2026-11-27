import Rider from "../models/Rider.js";
import crudController from "./crudController.js";
import { deleteImage, uploadImage } from "../config/cloudinary.js";

const crud = crudController(Rider);

export default {
  ...crud,
  create: async (req, res) => {
    const fields = { ...(req.body || {}) };
    delete fields.profileImage;
    delete fields.profileImagePublicId;
    const image = req.file
      ? await uploadImage(req.file, "foodtrial/riders")
      : null;
    try {
      const rider = await Rider.create({
        ...fields,
        profileImage: image?.url || "",
        profileImagePublicId: image?.publicId || "",
      });
      return res.status(201).json(rider);
    } catch (error) {
      if (image) await deleteImage(image.publicId);
      throw error;
    }
  },
  update: async (req, res) => {
    if (!req.file && !Object.keys(req.body || {}).length) {
      return res.status(400).json({ message: "Provide fields to update." });
    }
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Record not found." });
    }

    const oldImagePublicId = rider.profileImagePublicId;
    const fields = { ...(req.body || {}) };
    delete fields.profileImage;
    delete fields.profileImagePublicId;
    const image = req.file
      ? await uploadImage(req.file, "foodtrial/riders")
      : null;
    Object.assign(rider, fields);
    if (image) {
      rider.profileImage = image.url;
      rider.profileImagePublicId = image.publicId;
    }
    try {
      await rider.save();
    } catch (error) {
      if (image) await deleteImage(image.publicId);
      throw error;
    }
    if (image && oldImagePublicId) await deleteImage(oldImagePublicId);
    return res.json(rider);
  },
  remove: async (req, res) => {
    const rider = await Rider.findByIdAndDelete(req.params.id);
    if (!rider) return res.status(404).json({ message: "Record not found." });
    await deleteImage(rider.profileImagePublicId);
    return res.json({ message: "Record deleted.", id: rider.id });
  },
};
