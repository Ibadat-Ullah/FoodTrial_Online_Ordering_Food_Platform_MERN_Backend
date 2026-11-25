import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const response = (res, user, status = 200) =>
  res.status(status).json({
    token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    }),
    user: { id: user.id, name: user.name, email: user.email },
  });

export async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password must be at most 72 bytes." });
  }
  const user = await User.create({ name, email, password });
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
