import pool from "../config/db.js";

export const listStores = async (req, res) => {
  try {
    const { name, address, sortBy = "name", order = "asc" } = req.query;

    let query = `
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(CASE WHEN r.id IS NOT NULL THEN 1 END) as total_ratings
      FROM stores s
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

    if (address) {
      query += ` AND s.address ILIKE $${paramCount}`;
      params.push(`%${address}%`);
      paramCount++;
    }

    // Group by to aggregate ratings
    query += ` GROUP BY s.id, s.name, s.email, s.address`;

    // Sorting
    const validSortFields = ["name", "address", "avg_rating"];
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

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(CASE WHEN r.id IS NOT NULL THEN 1 END) as total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.email, s.address
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Store not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get store error:", error);
    res.status(500).json({
      error: "An error occurred while fetching store",
    });
  }
};
