import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is not set");
}

// Suppress pg security warnings about sslmode=require
if (dbUrl.includes("sslmode=require")) {
  dbUrl = dbUrl.replace("sslmode=require", "sslmode=verify-full");
}

const pool = new pg.Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
export * from "drizzle-orm";
