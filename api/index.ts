import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

// API Route: Handle Chat Requests using Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다. Vercel 프로젝트 설정(Environment Variables)에서 GEMINI_API_KEY를 올바르게 입력했는지 확인해 주세요."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Map communication messages to Google GenAI Content items
    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Default helper instruction if none specified
    const finalSystemInstruction = systemInstruction || 
      "You are a friendly, helpful, and highly intelligent AI Assistant. You communicate clearly and use Markdown for formatting your answers. Always answer in the language requested by the user, defaulting to Korean.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
      }
    });

    res.json({
      role: "model",
      content: response.text || "죄송합니다. 답변을 생성하지 못했습니다."
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "AI 서비스와 통신하는 중 오류가 발생했습니다."
    });
  }
});

export default app;
