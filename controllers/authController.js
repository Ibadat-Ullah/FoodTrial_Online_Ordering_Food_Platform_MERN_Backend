import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const response = (res, user, status = 200) =>
  res.status(status).json({
    token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    }),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

export async function register(req, res) {
  const { name, email, password, adminSetupKey } = req.body || {};
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password must be at most 72 bytes." });
  }
  if (adminSetupKey !== undefined && typeof adminSetupKey !== "string") {
    return res.status(400).json({ message: "Invalid admin setup key." });
  }

  let role = "customer";
  if (adminSetupKey) {
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedKey) {
      return res.status(503).json({ message: "Admin setup is not configured." });
    }

    const provided = Buffer.from(adminSetupKey, "utf8");
    const expected = Buffer.from(expectedKey, "utf8");
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return res.status(403).json({ message: "Invalid admin setup key." });
    }
    if (await User.exists({ role: "admin" })) {
      return res.status(409).json({ message: "Admin setup has already been used." });
    }
    role = "admin";
  }

  const user = await User.create({ name, email, password, role });
  return response(res, user, 201);
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required." });
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  return response(res, user);
}
