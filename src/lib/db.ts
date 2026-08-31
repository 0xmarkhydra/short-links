import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { shareLinkPool?: Pool };

export const db = globalForDb.shareLinkPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

if (process.env.NODE_ENV !== "production") globalForDb.shareLinkPool = db;

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return db.query<T>(text, params);
}
