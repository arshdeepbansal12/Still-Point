
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { assessmentSessions } from "./src/schema/assessment-sessions.js";

async function run() {
  const dbUrl = process.env.POSTGRES_URL.replace("sslmode=require", "");
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
      facialTensionIndex: null,
      crisisFlag: true,
      answers: [{"questionId":"emotional-01","answerValue":4}],
    });
    console.log("Success");
  } catch (err) {
    console.error("DB Error:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

