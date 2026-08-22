import { sql } from "drizzle-orm";
import { text, pgTable, real, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const assessmentSessions = pgTable("assessment_sessions", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  mcqScore: real("mcq_score").notNull(),
  finalScore: real("final_score").notNull(),
  band: text("band").notNull(),
  categoryScores: jsonb("category_scores").notNull(),
  facialDataUsed: boolean("facial_data_used").notNull().default(false),
  facialTensionIndex: real("facial_tension_index"),
  crisisFlag: boolean("crisis_flag").notNull().default(false),
  answers: jsonb("answers").notNull().default([]),
  journalEntry: text("journal_entry"),
});

export const insertAssessmentSessionSchema = createInsertSchema(assessmentSessions).omit({
  id: true,
  createdAt: true,
});
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = typeof assessmentSessions.$inferInsert;