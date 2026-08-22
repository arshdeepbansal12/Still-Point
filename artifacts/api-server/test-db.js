
import { db } from "./dist/index.mjs";
import { assessmentSessions } from "@workspace/db";

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
    process.exit(0);
  }
}
run();

