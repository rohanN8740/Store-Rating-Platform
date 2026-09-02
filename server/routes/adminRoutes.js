import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  getDashboard,
  listUsers,
  getUserById,
  createUser,
  listStores,
  createStore,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware, requireAdmin);

// GET /api/admin/dashboard
router.get("/dashboard", getDashboard);

// GET /api/admin/users
router.get("/users", listUsers);

// POST /api/admin/users
router.post("/users", createUser);

// GET /api/admin/users/:id
router.get("/users/:id", getUserById);

// GET /api/admin/stores
router.get("/stores", listStores);

// POST /api/admin/stores
router.post("/stores", createStore);

export default router;
