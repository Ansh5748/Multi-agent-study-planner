import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Types from the original StudyState
interface Subtopic {
  name: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  est_hours: number;
}

interface Resource {
  subtopic: string;
  title: string;
  format: "video" | "article" | "book" | "course" | "interactive";
  why: string;
}

interface ScheduleDay {
  day: number;
  focus: string;
  blocks: { subtopic: string; activity: string; minutes: number }[];
  reflection: string;
}

interface QuizQuestion {
  subtopic: string;
  question: string;
  type: "multiple_choice" | "short_answer";
  options: string[];
  answer: string;
}

async function runAgent(systemPrompt: string, userPrompt: string) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt + " Return ONLY strict JSON." },
      { role: "user", content: userPrompt },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("JSON parsing error", e, content);
    return {};
  }
}

app.post("/api/generate-plan", async (req, res) => {
  const { topic, skillLevel, daysAvailable, hoursPerDay } = req.body;

  try {
    // 1. Topic Analyzer
    const analyzerPrompt = `Break this topic into 5-8 ordered subtopics suitable for a ${skillLevel} learner. Topic: ${topic}. Return JSON with key "subtopics" as an array of objects: {name, summary, difficulty, est_hours}.`;
    const analyzerResult = await runAgent("You are a curriculum designer.", analyzerPrompt);
    const subtopics = analyzerResult.subtopics || [];

    // 2. Resource Curator
    const subtopicsText = subtopics.map((s: any) => `- ${s.name}: ${s.summary}`).join("\n");
    const curatorPrompt = `For each subtopic, recommend 2 high-quality resources. Mix formats. Subtopics:\n${subtopicsText}. Return JSON with key "resources" as an array: {subtopic, title, format, why}.`;
    const curatorResult = await runAgent("You are a learning-resource librarian.", curatorPrompt);
    const resources = curatorResult.resources || [];

    // 3. Schedule Builder
    const subtopicsJson = JSON.stringify(subtopics);
    const schedulerPrompt = `Build a ${daysAvailable}-day study schedule. ${hoursPerDay} hours per day. Subtopics:\n${subtopicsJson}. Return JSON with key "schedule" as an array: {day, focus, blocks: [{subtopic, activity, minutes}], reflection}.`;
    const schedulerResult = await runAgent("You are a study coach.", schedulerPrompt);
    const schedule = schedulerResult.schedule || [];

    // 4. Quiz Generator
    const subtopicNames = subtopics.map((s: any) => s.name).join(", ");
    const quizPrompt = `Write a quiz with one question per subtopic for "${topic}". Subtopics: ${subtopicNames}. Return JSON with key "quiz" as an array: {subtopic, question, type, options, answer}.`;
    const quizResult = await runAgent("You are an assessment designer.", quizPrompt);
    const quiz = quizResult.quiz || [];

    res.json({
      subtopics,
      resources,
      schedule,
      quiz
    });
  } catch (error: any) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
