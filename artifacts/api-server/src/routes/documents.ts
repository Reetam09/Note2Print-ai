import { Router, type IRouter } from "express";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  CreateDocumentBody,
  UpdateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  DeleteDocumentParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .orderBy(desc(documentsTable.createdAt));
  res.json(docs);
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .insert(documentsTable)
    .values({ ...parsed.data, updatedAt: new Date() })
    .returning();
  res.status(201).json(doc);
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .update(documentsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(documentsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/ai/format-document", async (req, res): Promise<void> => {
  const parsed = AiFormatDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { rawText, documentType, subject, grade, language, schoolName } = parsed.data;
  const langLabel = language === "bn" ? "Bengali" : "English";
  const prompt = `You are an expert educational document formatter. Convert the following raw notes into a clean, well-structured ${documentType} document.

Subject: ${subject ?? "General"}
Grade: ${grade ?? "N/A"}
Language: ${langLabel}
School: ${schoolName ?? "N/A"}

Raw input:
${rawText}

Output a clean, formatted educational document in Markdown format. Include appropriate headings, bullet points, and structure. Generate a suitable title. Correct grammar and spelling. Make it print-ready.

Return JSON: { "title": "...", "formattedContent": "...markdown content...", "summary": "...one sentence..." }`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const result = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  res.json({
    title: result.title ?? "Formatted Document",
    formattedContent: result.formattedContent ?? rawText,
    summary: result.summary ?? null,
  });
});

router.post("/ai/grammar-check", async (req, res): Promise<void> => {
  const parsed = AiGrammarCheckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { text, language } = parsed.data;
  const langLabel = language === "bn" ? "Bengali" : "English";
  const prompt = `Correct the grammar, spelling, and punctuation in the following ${langLabel} text. Return JSON: { "correctedText": "...", "corrections": <number of corrections made> }

Text:
${text}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const result = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  res.json({
    correctedText: result.correctedText ?? text,
    corrections: result.corrections ?? 0,
  });
});

import {
  AiFormatDocumentBody,
  AiGrammarCheckBody,
} from "@workspace/api-zod";

export default router;
