import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { UploadImageToTextBody, UploadVoiceToTextBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/uploads/image-to-text", async (req, res): Promise<void> => {
  const parsed = UploadImageToTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { imageBase64, mimeType, language, documentType } = parsed.data;
  const langLabel = language === "bn" ? "Bengali" : "English";

  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const prompt = `You are an expert OCR and educational document assistant. Extract all text from this image of handwritten notes or a document.

${documentType ? `This appears to be a: ${documentType}` : ""}
Language: ${langLabel}

First extract the raw text exactly as written. Then create a cleaned, corrected version that fixes obvious spelling mistakes and improves readability while preserving the educational content.

Return JSON: { "rawText": "...", "cleanedText": "...", "language": "${language ?? "en"}", "confidence": 0.95 }`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0]?.message?.content ?? "{}");
  res.json({
    rawText: result.rawText ?? "",
    cleanedText: result.cleanedText ?? result.rawText ?? "",
    language: result.language ?? (language ?? "en"),
    confidence: result.confidence ?? null,
  });
});

router.post("/uploads/voice-to-text", async (req, res): Promise<void> => {
  const parsed = UploadVoiceToTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { audioBase64, language } = parsed.data;
  const langLabel = language === "bn" ? "Bengali" : "English";

  const audioBuffer = Buffer.from(audioBase64, "base64");
  const rawText = await speechToText(audioBuffer, "wav");

  const cleanPrompt = `Clean up and correct this voice transcription for an educational document. Fix any speech-to-text errors, add proper punctuation, and improve readability. Language: ${langLabel}

Raw transcription:
${rawText}

Return JSON: { "rawText": "${rawText.replace(/"/g, '\\"')}", "cleanedText": "...", "language": "${language ?? "en"}" }`;

  const cleanResponse = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: cleanPrompt }],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(cleanResponse.choices[0]?.message?.content ?? "{}");
  res.json({
    rawText: result.rawText ?? rawText,
    cleanedText: result.cleanedText ?? rawText,
    language: result.language ?? (language ?? "en"),
    confidence: null,
  });
});

export default router;
