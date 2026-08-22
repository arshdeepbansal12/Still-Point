import { defineConfig } from "drizzle-kit";

let dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is not set");
}

dbUrl = dbUrl.replace("?sslmode=require", "").replace("&sslmode=require", "").replace("sslmode=require", "");

if (dbUrl.includes(".pooler.supabase.com:6543")) {
  dbUrl = dbUrl.replace(":6543", ":5432");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl: { rejectUnauthorized: false }
  },
});
