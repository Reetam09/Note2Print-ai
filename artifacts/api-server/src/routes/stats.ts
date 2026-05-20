import { Router, type IRouter } from "express";
import { desc, gte, sql, count } from "drizzle-orm";
import { db, documentsTable, examPapersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalDocsResult] = await db
    .select({ count: count() })
    .from(documentsTable);

  const [totalExamsResult] = await db
    .select({ count: count() })
    .from(examPapersTable);

  const [docsThisWeekResult] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(gte(documentsTable.createdAt, oneWeekAgo));

  const [examsThisWeekResult] = await db
    .select({ count: count() })
    .from(examPapersTable)
    .where(gte(examPapersTable.createdAt, oneWeekAgo));

  const byTypeResult = await db
    .select({ type: documentsTable.type, count: count() })
    .from(documentsTable)
    .groupBy(documentsTable.type);

  const recentDocuments = await db
    .select()
    .from(documentsTable)
    .orderBy(desc(documentsTable.createdAt))
    .limit(5);

  res.json({
    totalDocuments: totalDocsResult.count,
    totalExamPapers: totalExamsResult.count,
    documentsThisWeek: docsThisWeekResult.count,
    examPapersThisWeek: examsThisWeekResult.count,
    byType: byTypeResult,
    recentDocuments,
  });
});

router.get("/stats/recent-activity", async (_req, res): Promise<void> => {
  const recentDocs = await db
    .select({
      id: documentsTable.id,
      title: documentsTable.title,
      type: documentsTable.type,
      createdAt: documentsTable.createdAt,
    })
    .from(documentsTable)
    .orderBy(desc(documentsTable.createdAt))
    .limit(5);

  const recentExams = await db
    .select({
      id: examPapersTable.id,
      title: examPapersTable.title,
      type: examPapersTable.subject,
      createdAt: examPapersTable.createdAt,
    })
    .from(examPapersTable)
    .orderBy(desc(examPapersTable.createdAt))
    .limit(5);

  const activity = [
    ...recentDocs.map(d => ({ ...d, kind: "document" as const })),
    ...recentExams.map(e => ({ ...e, kind: "exam-paper" as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

  res.json(activity);
});

export default router;
