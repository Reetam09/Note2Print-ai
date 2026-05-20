import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examPapersTable = pgTable("exam_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  board: text("board"),
  totalMarks: integer("total_marks").notNull().default(100),
  duration: integer("duration"),
  difficulty: text("difficulty").notNull().default("medium"),
  sections: text("sections").notNull().default("[]"),
  answerKey: text("answer_key"),
  schoolName: text("school_name"),
  teacherName: text("teacher_name"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertExamPaperSchema = createInsertSchema(examPapersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExamPaper = z.infer<typeof insertExamPaperSchema>;
export type ExamPaper = typeof examPapersTable.$inferSelect;
