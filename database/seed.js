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

    const demoUsers = [
      [
        "System Administrator",
        "admin@storerating.com",
        "AdminPass@123",
        "123 Admin Street, City, Country",
        "ADMIN",
      ],
      [
        "Demo Store Rating User",
        "user@storerating.com",
        "UserPass@123",
        "123 User Street, City, Country",
        "USER",
      ],
      [
        "Demo Store Owner Account",
        "owner@storerating.com",
        "OwnerPass@123",
        "123 Owner Street, City, Country",
        "STORE_OWNER",
      ],
    ];

    for (const [name, email, password, address, role] of demoUsers) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );

      if (!existingUser.rows.length) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          `INSERT INTO users (name, email, password, address, role)
           VALUES ($1, $2, $3, $4, $5)`,
          [name, email, hashedPassword, address, role],
        );
        console.log(`✅ Seeded ${role} demo account: ${email}`);
      }
    }

    console.log("\n🎉 Database initialization complete!\n");
    console.log("Demo Credentials:");
    console.log("  User: user@storerating.com / UserPass@123");
    console.log("  Store owner: owner@storerating.com / OwnerPass@123");
    console.log("  Admin: admin@storerating.com / AdminPass@123\n");

    await pool.end();
  } catch (error) {
    console.error("❌ Error during database initialization:", error.message);
    process.exit(1);
  }
}

seed();
