import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const databaseSchema = (process.env.DATABASE_SCHEMA || "public").trim();
if (!/^[a-z][a-z0-9_]*$/.test(databaseSchema)) {
  console.error("DATABASE_SCHEMA must contain only lowercase letters, numbers and underscores");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const client = await pool.connect();
try {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${databaseSchema}"`);
  await client.query(`SET search_path TO "${databaseSchema}", public`);
  const migration = await fs.readFile(path.join(process.cwd(), "db/migrations/001_init.sql"), "utf8");
  await client.query(migration);
  console.log(`Database migration completed in schema ${databaseSchema}.`);
} finally {
  client.release();
  await pool.end();
}
