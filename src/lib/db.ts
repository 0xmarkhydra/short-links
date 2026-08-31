import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { shareLinkPool?: Pool };

const databaseSchema = (process.env.DATABASE_SCHEMA || "public").trim();
if (!/^[a-z][a-z0-9_]*$/.test(databaseSchema)) {
  throw new Error("DATABASE_SCHEMA must contain only lowercase letters, numbers and underscores");
}

export const db = globalForDb.shareLinkPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  options: `-c search_path=${databaseSchema},public`,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

if (process.env.NODE_ENV !== "production") globalForDb.shareLinkPool = db;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return db.query<T>(text, params);
}
