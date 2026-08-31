import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
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

const scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derived).toString("hex")}`;
}

const pool = new Pool({ connectionString });
const client = await pool.connect();
try {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${databaseSchema}"`);
  await client.query(`SET search_path TO "${databaseSchema}", public`);
  const migration = await fs.readFile(path.join(process.cwd(), "db/migrations/001_init.sql"), "utf8");
  await client.query(migration);
  console.log(`Database migration completed in schema ${databaseSchema}.`);

  const seedUsername = (process.env.DEFAULT_ADMIN_USERNAME || "").trim();
  const seedPassword = process.env.DEFAULT_ADMIN_PASSWORD || "";
  if (seedUsername && seedPassword) {
    const existingAdmin = await client.query(`SELECT username FROM users WHERE role='ADMIN' LIMIT 1`);
    if (existingAdmin.rowCount) {
      console.log(`Admin already exists in schema ${databaseSchema}; default admin seed skipped.`);
    } else {
      const usernameTaken = await client.query(`SELECT 1 FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1`, [seedUsername]);
      if (usernameTaken.rowCount) throw new Error(`Cannot seed admin: username ${seedUsername} already exists.`);
      const passwordHash = await hashPassword(seedPassword);
      await client.query(
        `INSERT INTO users (id, username, email, password_hash, role, status) VALUES ($1,$2,NULL,$3,'ADMIN','ACTIVE')`,
        [randomUUID(), seedUsername, passwordHash]
      );
      const verify = await client.query(`SELECT username FROM users WHERE role='ADMIN' ORDER BY created_at LIMIT 2`);
      if (verify.rowCount !== 1 || verify.rows[0]?.username !== seedUsername) {
        throw new Error("Default admin verification failed after insert.");
      }
      console.log(`Default admin created and verified in schema ${databaseSchema}: ${seedUsername}`);
    }
  }
} finally {
  client.release();
  await pool.end();
}
