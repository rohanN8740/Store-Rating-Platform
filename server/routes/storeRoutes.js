import express from "express";
import { listStores, getStoreById } from "../controllers/storeController.js";

const router = express.Router();

// GET /api/stores (with search, filter, and sort)
router.get("/", listStores);

// GET /api/stores/:id
router.get("/:id", getStoreById);

export default router;
