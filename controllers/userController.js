import User from "../models/User.js";

export async function list(_req, res) {
  const users = await User.find()
    .select("name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return res.json(users);
}
