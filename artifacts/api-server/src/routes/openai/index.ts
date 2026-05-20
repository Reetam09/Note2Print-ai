import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiVoiceMessageParams,
  SendOpenaiVoiceMessageBody,
  GenerateOpenaiImageBody,
} from "@workspace/api-zod";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router: IRouter = Router();

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const all = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(all);
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db.insert(conversations).values({ title: parsed.data.title }).returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, params.data.id)).orderBy(messages.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, params.data.id));
  const [conv] = await db.delete(conversations).where(eq(conversations.id, params.data.id)).returning();
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, params.data.id)).orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const convId = params.data.id;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({ conversationId: convId, role: "user", content: parsed.data.content });

  const history = await db.select().from(messages).where(eq(messages.conversationId, convId)).orderBy(messages.createdAt);
  const chatMessages = history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  const stream = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: "You are Note2Print AI — an expert educational assistant that helps teachers and students create professional educational documents, question papers, and assignments. Be helpful, concise, and education-focused." },
      ...chatMessages,
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  await db.insert(messages).values({ conversationId: convId, role: "assistant", content: fullResponse });
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/openai/conversations/:id/voice-messages", async (req, res): Promise<void> => {
  const params = SendOpenaiVoiceMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendOpenaiVoiceMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ensureCompatibleFormat, voiceChatStream } = await import("@workspace/integrations-openai-ai-server/audio");
  const audioBuffer = Buffer.from(parsed.data.audio, "base64");
  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
  const stream = await voiceChatStream(buffer, "alloy", format);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let userTranscript = "";
  let assistantTranscript = "";
  for await (const event of stream) {
    if (event.type === "transcript") {
      assistantTranscript += event.data ?? "";
    } else if (event.type === "user_transcript") {
      userTranscript += event.data ?? "";
    }
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  await db.insert(messages).values([
    { conversationId: params.data.id, role: "user", content: userTranscript },
    { conversationId: params.data.id, role: "assistant", content: assistantTranscript },
  ]);

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/openai/generate-image", async (req, res): Promise<void> => {
  const parsed = GenerateOpenaiImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const buffer = await generateImageBuffer(parsed.data.prompt, "1024x1024");
  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
