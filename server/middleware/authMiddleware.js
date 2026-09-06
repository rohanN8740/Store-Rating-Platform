import jwt from "jsonwebtoken";

const getCookie = (cookieHeader, name) =>
  cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([key]) => key === name)?.[1];

export const authMiddleware = (req, res, next) => {
  try {
    const token =
      getCookie(req.headers.cookie, "authToken") ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token =
      getCookie(req.headers.cookie, "authToken") ||
      req.headers.authorization?.split(" ")[1];

    if (token) {
      req.user = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "your_jwt_secret_key_change_this_in_production",
      );
    }
  } catch {
    // Store listings remain public when no valid login is present.
  }

  next();
};
