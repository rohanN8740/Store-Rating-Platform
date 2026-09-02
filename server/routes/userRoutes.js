import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProfile, changePassword } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", authMiddleware, getProfile);

// PUT /api/users/password
router.put("/password", authMiddleware, changePassword);

export default router;
