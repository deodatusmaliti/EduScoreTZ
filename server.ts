import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { apiRouter } from "./server/routes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Mount in-built backend API routes
  app.use("/api", apiRouter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "3.0.0", system: "EduScore TZ In-Built Backend Engine" });
  });

  // AI Advisor Endpoint for NECTA Curriculum & Student Pedagogical Recommendations
  app.post("/api/ai-advisor", async (req, res) => {
    try {
      const { prompt, student, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 5) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
        const systemInstruction = `You are the chief academic strategist for EduScore TZ, a premier Tanzanian educational analytics platform aligned with NECTA (National Examinations Council of Tanzania) and TIE (Tanzania Institute of Education) standards for CSEE (Form 4) and ACSEE (Form 6).
Provide structured, highly practical, supportive, and pedagogical recommendations. Include:
1. Academic diagnostic analysis
2. Specific syllabus subtopics to target
3. Remedial intervention strategies
4. Parent involvement suggestions
Keep the tone professional, encouraging, and actionable.`;

        const userContent = `Request: ${prompt || "Analyze student performance and provide strategic pedagogical interventions."}
Context: ${JSON.stringify(context || {})}
Student Profile: ${JSON.stringify(student || {})}`;

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `${systemInstruction}\n\n${userContent}`,
          });
        } catch (modelError: any) {
          console.warn("Retrying with gemini-3.6-flash:", modelError?.message);
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `${systemInstruction}\n\n${userContent}`,
          });
        }

        return res.json({ text: response.text, source: "gemini" });
      }

      // Fallback rule-based pedagogical expert system
      const fallbackAnalysis = generateFallbackAdvice(prompt, student, context);
      return res.json({ text: fallbackAnalysis, source: "rule-engine" });
    } catch (error: any) {
      console.error("AI Advisor error:", error);
      const fallbackAnalysis = generateFallbackAdvice(req.body?.prompt, req.body?.student, req.body?.context);
      return res.json({ text: fallbackAnalysis, source: "rule-engine", note: "Using internal NECTA expert engine" });
    }
  });

  function generateFallbackAdvice(prompt?: string, student?: any, context?: any): string {
    if (student) {
      const name = student.name || "The student";
      const avg = student.average || 50;
      const math = student.mathematics ?? 50;
      const div = student.nectaDivision || "Division II";

      return `### NECTA Pedagogical Advisory for ${name} (${student.form || "Form IV"})
**Current Baseline:** Average: ${avg}% | Projected NECTA Tier: ${div}

1. **Academic Diagnosis:**
${math < 45 ? `- **Critical Mathematics Intervention Required:** Scoring ${math}% indicates severe gaps in fundamental algebraic and trigonometric manipulations frequently tested in NECTA Paper 1.` : `- **Strong Foundation:** Academic metrics reflect consistent mastery across core disciplines with opportunities to reach Division I honors.`}

2. **Targeted Remedial Actions:**
- Allocate 2 additional weekly peer study group sessions focused on past NECTA CSEE papers (2020–2025).
- Provide step-by-step worked solutions for geometry, circle theorems, and coordinate geometry.
- Introduce weekly continuous formative quizzes to monitor improvement.

3. **Parent & Stakeholder Collaboration:**
- Schedule a parent consultative conference with ${student.parent || "the guardian"} to establish structured evening revision blocks (minimum 2 hours daily).
- Monitor attendance closely to prevent mid-term drops.`;
    }

    return `### Institutional NECTA Strategic Advisory (2026 Academic Cycle)
1. **Focus on Core Science Syllabi:** Form IV Mathematics and Physics currently reflect the highest failure variance across national testing cohorts.
2. **Diagnostic Pre-Mock Testing:** Deploy synchronized mock clusters 6 weeks prior to final examinations to identify students in the Division III/IV boundary.
3. **Faculty Resource Sharing:** Conduct inter-departmental workshops between Senior Science faculty and junior form instructors to reinforce foundational concepts early in Form II.`;
  }

  // Vite middleware for development
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
    console.log(`EduScore TZ Server running on http://localhost:${PORT}`);
  });
}

startServer();
