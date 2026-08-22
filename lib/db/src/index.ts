import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

import fs from "node:fs";
import path from "node:path";

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const pathsToTry = [
    path.resolve(process.cwd(), "sqlite.db"),
    path.resolve(process.cwd(), "../../sqlite.db"),
    path.resolve(process.cwd(), "../sqlite.db"),
    path.resolve(import.meta.dirname || "", "../../../sqlite.db"),
    path.resolve(import.meta.dirname || "", "../../sqlite.db"),
  ];

  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      dbUrl = p;
      break;
    }
  }
}

if (!dbUrl) {
  throw new Error("DATABASE_URL is not set and no default sqlite.db was found");
}

const sqlite = new Database(dbUrl);
export const db = drizzle(sqlite, { schema });

export * from "./schema";
export * from "drizzle-orm";

export * from "./schema";
export * from "drizzle-orm";
