import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, examPapersTable } from "@workspace/db";
import {
  CreateExamPaperBody,
  UpdateExamPaperBody,
  GetExamPaperParams,
  UpdateExamPaperParams,
  DeleteExamPaperParams,
  GenerateExamPaperBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/exam-papers", async (_req, res): Promise<void> => {
  const papers = await db
    .select()
    .from(examPapersTable)
    .orderBy(desc(examPapersTable.createdAt));
  res.json(papers);
});

router.post("/exam-papers", async (req, res): Promise<void> => {
  const parsed = CreateExamPaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [paper] = await db
    .insert(examPapersTable)
    .values({ ...parsed.data, updatedAt: new Date() })
    .returning();
  res.status(201).json(paper);
});

router.post("/exam-papers/generate", async (req, res): Promise<void> => {
  const parsed = GenerateExamPaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    subject,
    grade,
    board,
    chapter,
    topic,
    totalMarks,
    duration,
    difficulty,
    questionTypes,
    schoolName,
    teacherName,
    sourceText,
  } = parsed.data;

  const typeLabels: Record<string, string> = {
    "mcq": "Multiple Choice Questions",
    "fill-blanks": "Fill in the Blanks",
    "true-false": "True or False",
    "match": "Match the Following",
    "short": "Short Answer Questions",
    "long": "Long Answer Questions",
    "one-word": "One-Word Answers",
    "assertion": "Assertion and Reasoning",
    "case-study": "Case Study Questions",
  };

  const marksMap: Record<string, number> = {
    "mcq": 1, "fill-blanks": 1, "true-false": 1, "one-word": 1,
    "match": 2, "assertion": 2, "short": 3, "case-study": 4, "long": 5,
  };

  const selectedTypes = questionTypes.filter(t => t in marksMap);
  const totalWeight = selectedTypes.reduce((sum, t) => sum + marksMap[t], 0);
  const sectionsDesc = selectedTypes.map((t, i) => {
    const marks = Math.round((marksMap[t] / totalWeight) * totalMarks);
    const questionsCount = Math.max(1, Math.round(marks / marksMap[t]));
    return `Section ${String.fromCharCode(65 + i)}: ${typeLabels[t] ?? t} — ${questionsCount} questions × ${marksMap[t]} marks = ${questionsCount * marksMap[t]} marks`;
  }).join("\n");

  const prompt = `You are an expert exam paper generator for Indian schools. Generate a complete, professional exam paper.

Subject: ${subject}
Grade/Class: ${grade}
Board: ${board ?? "CBSE"}
Chapter/Unit: ${chapter ?? "Full Syllabus"}
Topic: ${topic ?? "All Topics"}
Total Marks: ${totalMarks}
Duration: ${duration ?? 180} minutes
Difficulty: ${difficulty}
${sourceText ? `Source Notes:\n${sourceText}\n` : ""}

Paper structure:
${sectionsDesc}

Generate actual questions appropriate for the grade and difficulty level. For MCQs, provide 4 options (a, b, c, d) and mark the correct answer. For Match the Following, provide two columns. For Case Study, provide a paragraph followed by questions.

Return as JSON:
{
  "title": "...",
  "sections": [
    {
      "sectionId": "A",
      "name": "...",
      "questionType": "mcq|fill-blanks|true-false|match|short|long|one-word|assertion|case-study",
      "marksPerQuestion": <number>,
      "totalMarks": <number>,
      "questions": [
        {
          "id": 1,
          "question": "...",
          "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
          "answer": "..."
        }
      ]
    }
  ],
  "answerKey": [
    { "sectionId": "A", "questionId": 1, "answer": "..." }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  const sectionsJson = JSON.stringify(result.sections ?? []);
  const answerKeyJson = JSON.stringify(result.answerKey ?? []);

  const title = result.title ?? `${subject} Exam Paper - Grade ${grade}`;

  const [paper] = await db
    .insert(examPapersTable)
    .values({
      title,
      subject,
      grade,
      board: board ?? null,
      totalMarks,
      duration: duration ?? null,
      difficulty,
      sections: sectionsJson,
      answerKey: answerKeyJson,
      schoolName: schoolName ?? null,
      teacherName: teacherName ?? null,
      status: "ready",
      updatedAt: new Date(),
    })
    .returning();

  res.status(201).json(paper);
});

router.get("/exam-papers/:id", async (req, res): Promise<void> => {
  const params = GetExamPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [paper] = await db
    .select()
    .from(examPapersTable)
    .where(eq(examPapersTable.id, params.data.id));
  if (!paper) {
    res.status(404).json({ error: "Exam paper not found" });
    return;
  }
  res.json(paper);
});

router.patch("/exam-papers/:id", async (req, res): Promise<void> => {
  const params = UpdateExamPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExamPaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [paper] = await db
    .update(examPapersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(examPapersTable.id, params.data.id))
    .returning();
  if (!paper) {
    res.status(404).json({ error: "Exam paper not found" });
    return;
  }
  res.json(paper);
});

router.delete("/exam-papers/:id", async (req, res): Promise<void> => {
  const params = DeleteExamPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [paper] = await db
    .delete(examPapersTable)
    .where(eq(examPapersTable.id, params.data.id))
    .returning();
  if (!paper) {
    res.status(404).json({ error: "Exam paper not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
