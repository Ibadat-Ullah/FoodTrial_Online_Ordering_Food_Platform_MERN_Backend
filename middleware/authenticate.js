import jwt from "jsonwebtoken";

export default function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
