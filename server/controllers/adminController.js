import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRole,
} from "../utils/validation.js";

export const getDashboard = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM stores) as total_stores,
        (SELECT COUNT(*) FROM ratings) as total_ratings
    `);

    res.json({
      totalUsers: parseInt(stats.rows[0].total_users),
      totalStores: parseInt(stats.rows[0].total_stores),
      totalRatings: parseInt(stats.rows[0].total_ratings),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      error: "An error occurred while fetching dashboard",
    });
  }
};

export const listUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy = "name",
      order = "asc",
    } = req.query;

    let query = `
      SELECT id, name, email, address, role, created_at
      FROM users
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add filters
    if (name) {
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${name}%`);
      paramCount++;
    }

    if (email) {
      query += ` AND email ILIKE $${paramCount}`;
      params.push(`%${email}%`);
      paramCount++;
    }

    if (address) {
      query += ` AND address ILIKE $${paramCount}`;
      params.push(`%${address}%`);
      paramCount++;
    }

    if (role && validateRole(role)) {
      query += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    // Sorting
    const validSortFields = ["name", "email", "address", "role"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name";
    const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({
      error: "An error occurred while fetching users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT id, name, email, address, role, created_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const user = result.rows[0];

    // If user is a store owner, include their store rating
    if (user.role === "STORE_OWNER") {
      const storeResult = await pool.query(
        `SELECT COALESCE(AVG(r.rating), 0) as avg_rating
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = $1
         GROUP BY s.id`,
        [id],
      );

      if (storeResult.rows.length > 0) {
        user.store_rating = parseFloat(storeResult.rows[0].avg_rating);
      }
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "An error occurred while fetching user",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Validation
    if (!name || !email || !password || !address || !role) {
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

    if (!validateRole(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be ADMIN, USER, or STORE_OWNER",
      });
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
      [name, email, hashedPassword, address, role],
    );

    const user = result.rows[0];

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      error: "An error occurred while creating user",
    });
  }
};

export const listStores = async (req, res) => {
  try {
    const { name, email, address, sortBy = "name", order = "asc" } = req.query;

    let query = `
      SELECT 
        s.id,
        s.name,
        s.email,
        s.address,
        u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(CASE WHEN r.id IS NOT NULL THEN 1 END) as total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add filters
    if (name) {
      query += ` AND s.name ILIKE $${paramCount}`;
      params.push(`%${name}%`);
      paramCount++;
    }

    if (email) {
      query += ` AND s.email ILIKE $${paramCount}`;
      params.push(`%${email}%`);
      paramCount++;
    }

    if (address) {
      query += ` AND s.address ILIKE $${paramCount}`;
      params.push(`%${address}%`);
      paramCount++;
    }

    // Group by to aggregate ratings
    query += ` GROUP BY s.id, s.name, s.email, s.address, u.name`;

    // Sorting
    const validSortFields = ["name", "email", "address", "avg_rating"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "name";
    const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    query += ` ORDER BY ${
      sortField === "avg_rating" ? "avg_rating" : `s.${sortField}`
    } ${sortOrder}`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("List stores error:", error);
    res.status(500).json({
      error: "An error occurred while fetching stores",
    });
  }
};

export const createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Validation
    if (!name || !email || !address) {
      return res.status(400).json({
        error: "Name, email, and address are required",
      });
    }

    if (!validateName(name)) {
      return res.status(400).json({
        error: "Store name must be between 20 and 60 characters",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        error: "Address must not exceed 400 characters",
      });
    }

    // Check if email exists
    const emailCheckResult = await pool.query(
      "SELECT id FROM stores WHERE email = $1",
      [email],
    );

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({
        error: "Store email already exists",
      });
    }

    // If owner ID provided, verify it's a valid STORE_OWNER user
    let finalOwnerId = null;
    if (ownerId) {
      const ownerResult = await pool.query(
        "SELECT id, role FROM users WHERE id = $1 AND role = $2",
        [ownerId, "STORE_OWNER"],
      );

      if (ownerResult.rows.length === 0) {
        return res.status(400).json({
          error: "Owner must be a STORE_OWNER user",
        });
      }

      finalOwnerId = ownerId;
    }

    // Create store
    const result = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id`,
      [name, email, address, finalOwnerId],
    );

    const store = result.rows[0];

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    console.error("Create store error:", error);
    res.status(500).json({
      error: "An error occurred while creating store",
    });
  }
};
