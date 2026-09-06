import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAddress,
  validateRole,
} from "../utils/validation.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
    { expiresIn: "7d" },
  );
};

const setAuthCookie = (res, token) => {
  const attributes = [
    "HttpOnly",
    `SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"}`,
    "Path=/",
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  const oldCookie = [
    "authToken=",
    "HttpOnly",
    `SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"}`,
    "Path=/api/auth",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") oldCookie.push("Secure");
  res.setHeader("Set-Cookie", [
    `authToken=${token}; ${attributes.join("; ")}`,
    oldCookie.join("; "),
  ]);
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validation
    if (!name || !email || !password || !address) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (!validateName(name)) {
      return res.status(400).json({
        error: "Name must be between 20 and 60 characters",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "Password must be 8-16 characters, contain at least one uppercase letter and one special character",
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        error: "Address must not exceed 400 characters",
      });
    }

    // Determine role - default to USER if not provided or invalid
    let userRole = "USER";
    if (role && validateRole(role)) {
      // Only ADMIN can create other roles via signup
      if (role !== "USER") {
        return res.status(403).json({
          error: "Only administrators can create admin or store owner accounts",
        });
      }
      userRole = role;
    }

    // Check if email exists
    const emailCheckResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, address, userRole],
    );

    const user = result.rows[0];
    const token = generateToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "An error occurred during signup",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Get user by email
    const result = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    if (role && validateRole(role) && user.role !== role) {
      return res.status(401).json({
        error: "The selected account type does not match this account",
      });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "An error occurred during login",
    });
  }
};

export const logout = (req, res) => {
  const cookies = [
    [
      "authToken=",
      "HttpOnly",
      `SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"}`,
      "Path=/",
      "Max-Age=0",
    ],
    [
      "authToken=",
      "HttpOnly",
      `SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"}`,
      "Path=/api/auth",
      "Max-Age=0",
    ],
  ];
  if (process.env.NODE_ENV === "production") {
    cookies.forEach((cookie) => cookie.push("Secure"));
  }
  res.setHeader(
    "Set-Cookie",
    cookies.map((cookie) => cookie.join("; ")),
  );
  res.json({ message: "Logout successful" });
};
