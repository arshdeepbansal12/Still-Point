import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is not set");
}

// Supabase SSL fix: strip sslmode to avoid cert chain errors and warnings, and pass ssl object
dbUrl = dbUrl.replace("?sslmode=require", "").replace("&sslmode=require", "").replace("sslmode=require", "");

// Supabase PgBouncer fix: switch from Transaction pooler (6543) to Session pooler (5432)
// Drizzle uses prepared statements which are not supported by Supabase's transaction pooler.
if (dbUrl.includes(".pooler.supabase.com:6543")) {
  dbUrl = dbUrl.replace(":6543", ":5432");
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "drizzle-orm";
