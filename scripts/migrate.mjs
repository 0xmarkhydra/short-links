import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString });
try {
  const migration = await fs.readFile(path.join(process.cwd(), "db/migrations/001_init.sql"), "utf8");
  await pool.query(migration);
  console.log("Database migration completed.");
} finally {
  await pool.end();
}
