import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireUser } from "../middleware/roleMiddleware.js";
import { submitRating, updateRating } from "../controllers/ratingController.js";

const router = express.Router();

// POST /api/ratings (submit a new rating)
router.post("/", authMiddleware, submitRating);

// PUT /api/ratings/:id (update existing rating)
router.put("/:id", authMiddleware, updateRating);

export default router;
