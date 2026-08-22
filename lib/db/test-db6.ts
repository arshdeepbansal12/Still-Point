
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { assessmentSessions } from "./src/schema/assessment-sessions.js";

async function run() {
  let dbUrl = process.env.POSTGRES_URL.replace("sslmode=require", "");
  dbUrl = dbUrl.replace(":6543", ":5432");
  const pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);
  try {
    await db.insert(assessmentSessions).values({
      mcqScore: 78,
      finalScore: 78,
      band: "high",
      categoryScores: {"emotional":50,"physical":100,"behavioral":100},
      facialDataUsed: false,
      facialTensionIndex: undefined,
      crisisFlag: true,
      answers: [{"questionId":"emotional-01","answerValue":4}],
    }).returning();
    console.log("Success!");
  } catch (err: any) {
    console.error("DB Error Message:", err.message);
    if (err.cause) {
      console.error("DB Error Cause:", err.cause);
    }
  } finally {
    process.exit(0);
  }
}
run();

