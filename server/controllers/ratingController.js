import pool from "../config/db.js";
import { validateRating } from "../utils/validation.js";

export const submitRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeId, rating } = req.body;

    // Validation
    if (!storeId || rating === undefined) {
      return res.status(400).json({
        error: "Store ID and rating are required",
      });
    }

    if (!validateRating(rating)) {
      return res.status(400).json({
        error: "Rating must be an integer between 1 and 5",
      });
    }

    // Check if store exists
    const storeResult = await pool.query(
      "SELECT id FROM stores WHERE id = $1",
      [storeId],
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    // Check if user already rated this store
    const existingRatingResult = await pool.query(
      "SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2",
      [userId, storeId],
    );

    if (existingRatingResult.rows.length > 0) {
      return res.status(400).json({
        error:
          "You have already rated this store. Use PUT to update your rating.",
      });
    }

    // Create rating
    const result = await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, store_id, rating, created_at`,
      [userId, storeId, rating],
    );

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: result.rows[0],
    });
  } catch (error) {
    console.error("Submit rating error:", error);
    res.status(500).json({
      error: "An error occurred while submitting rating",
    });
  }
};

export const updateRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating } = req.body;

    // Validation
    if (rating === undefined) {
      return res.status(400).json({
        error: "Rating is required",
      });
    }

    if (!validateRating(rating)) {
      return res.status(400).json({
        error: "Rating must be an integer between 1 and 5",
      });
    }

    // Check if rating exists and belongs to user
    const ratingResult = await pool.query(
      "SELECT id, user_id FROM ratings WHERE id = $1",
      [id],
    );

    if (ratingResult.rows.length === 0) {
      return res.status(404).json({
        error: "Rating not found",
      });
    }

    if (ratingResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: "You can only update your own ratings",
      });
    }

    // Update rating
    const result = await pool.query(
      `UPDATE ratings SET rating = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, user_id, store_id, rating, updated_at`,
      [rating, id],
    );

    res.json({
      message: "Rating updated successfully",
      rating: result.rows[0],
    });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({
      error: "An error occurred while updating rating",
    });
  }
};
