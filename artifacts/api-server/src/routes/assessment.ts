import { Router, type IRouter } from "express";

import {
  CreateAssessmentSessionBody,
  CreateAssessmentSessionResponse,
  GetAssessmentSessionParams,
  GetAssessmentSessionResponse,
  ListAssessmentSessionsResponse,
  DeleteAssessmentSessionParams,
} from "@workspace/api-zod";
import { db, assessmentSessions, desc, eq } from "@workspace/db";

const router: IRouter = Router();

function serializeSession(row: typeof assessmentSessions.$inferSelect) {
  return {
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
    categoryScores: row.categoryScores as { emotional: number; physical: number; behavioral: number },
    answers: row.answers as { questionId: string; answerValue: number }[],
  };
}

router.get("/assessment/sessions", async (_req: any, res: any, next: any) => {
  try {
    const rows = await db.select().from(assessmentSessions).orderBy(desc(assessmentSessions.createdAt)).limit(30);
    res.json(ListAssessmentSessionsResponse.parse(rows.map(serializeSession)));
  } catch (error) {
    next(error);
  }
});

router.post("/assessment/sessions", async (req: any, res: any, next: any) => {
  try {
    const input = CreateAssessmentSessionBody.parse(req.body);
    const [row] = await db.insert(assessmentSessions).values({
      ...input,
      categoryScores: input.categoryScores,
      answers: input.answers ?? [],
    }).returning();
    res.status(201).json(CreateAssessmentSessionResponse.parse(serializeSession(row)));
  } catch (error) {
    next(error);
  }
});

router.get("/assessment/sessions/:id", async (req: any, res: any, next: any) => {
  try {
    const { id } = GetAssessmentSessionParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(assessmentSessions).where(eq(assessmentSessions.id, id)).limit(1);
    if (!row) {
      res.status(404).json({ error: "Assessment session not found" });
      return;
    }
    res.json(GetAssessmentSessionResponse.parse(serializeSession(row)));
  } catch (error) {
    next(error);
  }
});

router.delete("/assessment/sessions/:id", async (req: any, res: any, next: any) => {
  try {
    const { id } = DeleteAssessmentSessionParams.parse({ id: Number(req.params.id) });
    await db.delete(assessmentSessions).where(eq(assessmentSessions.id, id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;