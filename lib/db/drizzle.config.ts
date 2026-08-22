import { defineConfig } from "drizzle-kit";

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is not set");
}

if (dbUrl.includes("sslmode=require")) {
  dbUrl = dbUrl.replace("sslmode=require", "sslmode=verify-full");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
