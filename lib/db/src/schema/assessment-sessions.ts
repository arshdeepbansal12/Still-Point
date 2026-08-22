import { sql } from "drizzle-orm";
import { text, sqliteTable, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

export const assessmentSessions = sqliteTable("assessment_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  mcqScore: real("mcq_score").notNull(),
  finalScore: real("final_score").notNull(),
  band: text("band").notNull(),
  categoryScores: text("category_scores", { mode: "json" }).notNull(),
  facialDataUsed: integer("facial_data_used", { mode: "boolean" }).notNull().default(false),
  facialTensionIndex: real("facial_tension_index"),
  crisisFlag: integer("crisis_flag", { mode: "boolean" }).notNull().default(false),
  answers: text("answers", { mode: "json" }).notNull().default('[]'),
  journalEntry: text("journal_entry"),
});

export const insertAssessmentSessionSchema = createInsertSchema(assessmentSessions).omit({
  id: true,
  createdAt: true,
});
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = typeof assessmentSessions.$inferInsert;