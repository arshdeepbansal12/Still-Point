import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is not set");
}

// Supabase SSL fix: strip sslmode to avoid cert chain errors and warnings, and pass ssl object
dbUrl = dbUrl.replace("?sslmode=require", "").replace("&sslmode=require", "").replace("sslmode=require", "");

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "drizzle-orm";
