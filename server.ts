import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parsing with high limit for base64 audio payload
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please add your key in the Settings > Secrets panel." 
      });
    }

    console.log("Received transcription request with audio length:", audio.length, "mimeType:", mimeType);

    const audioPart = {
      inlineData: {
        data: audio,
        mimeType: mimeType || "audio/webm;codecs=opus",
      },
    };

    const prompt = `You are an expert audio diarization and transcription engine. Your job is to analyze the audio file and identify EVERY unique speaker based on their vocal pitch, tone, voice texture, accent, and conversational turns.
1. Perform Speaker Diarization: ALWAYS identify separate speakers (e.g. 'You (Speaker A)', 'Priya (Speaker B)', 'Raj (Speaker C)' or 'Speaker A', 'Speaker B') when they speak. Do not cluster different people under the same label!
2. Be highly sensitive to turn-taking and speaker changes. Every time a new voice speaks, create a separate segment with correct start and end times.
3. Transcribe each segment accurately in the spoken language. The speakers might use English, Hindi, or Hinglish (mix of Hindi and English) — please transcribe in the actual spoken language (transcribe Hindi words in Hindi Devanagari script or Hinglish words using natural Romanized Hinglish spelling).
4. Return the result STRICTLY as a JSON array of segments.

JSON Schema format of each segment object in the array:
{
  "id": "string (unique identifier, e.g. seg_0, seg_1)",
  "speaker": "string (e.g. 'You (Speaker A)', 'Priya (Speaker B)', 'Raj (Speaker C)')",
  "start": number (start time in seconds, float),
  "end": number (end time in seconds, float),
  "text": "string (the transcribed spoken words in original language)",
  "confidence": number (float between 0.0 and 1.0),
  "language": "string (must be 'English', 'Hindi' or 'Hinglish')"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        audioPart,
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              speaker: { type: Type.STRING },
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              language: { type: Type.STRING },
            },
            required: ["id", "speaker", "start", "end", "text", "confidence", "language"],
          },
        },
      },
    });

    let resultText = response.text || "[]";
    console.log("Transcribe response raw:", resultText);
    
    // Robustly clean JSON fences in case model returns markdown wrapper
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```[a-zA-Z]*\s*/, "");
      cleanedText = cleanedText.replace(/\s*```$/, "");
    }
    cleanedText = cleanedText.trim();

    const parsedSegments = JSON.parse(cleanedText);
    res.json({ segments: parsedSegments });
  } catch (err: any) {
    console.error("Transcribe error details:", err);
    res.status(500).json({ error: err.message || "Failed to process transcription" });
  }
});

// Vite Middleware & Static Serving Setup
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();
