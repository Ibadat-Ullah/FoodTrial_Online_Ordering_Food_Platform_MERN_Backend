import Rider from "../models/Rider.js";
import crudController from "./crudController.js";
import {
  removeUploadedImage,
  uploadedImagePath,
} from "../middleware/upload.js";

const crud = crudController(Rider);

export default {
  ...crud,
  create: async (req, res) => {
    const fields = { ...(req.body || {}) };
    delete fields.profileImage;
    try {
      const rider = await Rider.create({
        ...fields,
        profileImage: req.file ? uploadedImagePath(req.file) : "",
      });
      return res.status(201).json(rider);
    } catch (error) {
      if (req.file) await removeUploadedImage(uploadedImagePath(req.file));
      throw error;
    }
  },
  update: async (req, res) => {
    if (!req.file && !Object.keys(req.body || {}).length) {
      return res.status(400).json({ message: "Provide fields to update." });
    }
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      if (req.file) await removeUploadedImage(uploadedImagePath(req.file));
      return res.status(404).json({ message: "Record not found." });
    }

    const oldImage = rider.profileImage;
    const fields = { ...(req.body || {}) };
    delete fields.profileImage;
    Object.assign(rider, fields);
    if (req.file) rider.profileImage = uploadedImagePath(req.file);
    try {
      await rider.save();
    } catch (error) {
      if (req.file) await removeUploadedImage(uploadedImagePath(req.file));
      throw error;
    }
    if (req.file) await removeUploadedImage(oldImage);
    return res.json(rider);
  },
  remove: async (req, res) => {
    const rider = await Rider.findByIdAndDelete(req.params.id);
    if (!rider) return res.status(404).json({ message: "Record not found." });
    await removeUploadedImage(rider.profileImage);
    return res.json({ message: "Record deleted.", id: rider.id });
  },
};
