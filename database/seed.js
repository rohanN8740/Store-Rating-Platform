import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../server/config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  try {
    console.log("🔄 Starting database initialization...");

    // Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    console.log("📋 Executing schema...");
    await pool.query(schema);
    console.log("✅ Schema created successfully");

    // Check if admin already exists
    const adminCheckResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@storerating.com"],
    );

    if (adminCheckResult.rows.length > 0) {
      console.log("ℹ️  Admin user already exists. Skipping seed.");
      await pool.end();
      return;
    }

    // Hash password: AdminPass@123
    const hashedPassword = await bcrypt.hash("AdminPass@123", 10);

    // Seed admin user
    console.log("👤 Seeding admin user...");
    await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        "System Administrator",
        "admin@storerating.com",
        hashedPassword,
        "123 Admin Street, City, Country",
        "ADMIN",
      ],
    );
    console.log("✅ Admin user created successfully");

    console.log("\n🎉 Database initialization complete!\n");
    console.log("Admin Credentials:");
    console.log("  Email: admin@storerating.com");
    console.log("  Password: AdminPass@123\n");

    await pool.end();
  } catch (error) {
    console.error("❌ Error during database initialization:", error.message);
    process.exit(1);
  }
}

seed();
