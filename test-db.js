
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { assessmentSessions } from "./lib/db/dist/schema/assessment-sessions.js";

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool);

async function run() {
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
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}
run();

