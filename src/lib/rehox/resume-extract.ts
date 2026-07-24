import { createServerFn } from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { ParsedSource, Skill, CategoryCode } from "./types";

// ── Zod schema ────────────────────────────────────────────────────────────────

const VALID_CATEGORY_CODES: CategoryCode[] = [
  "DSA",
  "COD",
  "OOD",
  "APTI",
  "COMM",
  "AI",
  "CLOUD",
  "SQL",
  "SWE",
  "SYSD",
  "NETW",
  "OS",
  "OTHER",
];

const SkillSchema = z.object({
  skill_name: z.string(),
  category_code: z.enum([
    "DSA",
    "COD",
    "OOD",
    "APTI",
    "COMM",
    "AI",
    "CLOUD",
    "SQL",
    "SWE",
    "SYSD",
    "NETW",
    "OS",
    "OTHER",
  ]),
  evidence: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

const ParsedResumeSchema = z.object({
  source_type: z.literal("resume"),
  source_file: z.string(),
  company: z.string(),
  role: z.string(),
  education: z.string().optional(),
  projects: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  skills: z.array(SkillSchema),
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a talent intelligence engine. Your task is to extract structured skill data from a candidate's resume.

RADIX skill categories (use ONLY these codes):
- COD  : Coding / Programming languages
- DSA  : Data Structures & Algorithms
- OOD  : Object-Oriented Design & patterns
- APTI : Quantitative Aptitude / Logical reasoning / Statistics / Math
- COMM : Communication & collaboration / leadership
- AI   : AI / ML / Data Science / BI tools / Analytics
- CLOUD: Cloud platforms (AWS, GCP, Azure, etc.)
- SQL  : SQL / Databases / Data modeling / NoSQL
- SWE  : Software Engineering practices (CI/CD, testing, Agile, code review)
- SYSD : System Design / Distributed systems / Architecture
- NETW : Networking / Protocols / TCP/IP
- OS   : Operating Systems / Linux / Shell scripting
- OTHER: Anything that does not fit the above

Rules:
1. Infer skills from the resume's projects, experience, and descriptions — not just a skills section.
2. Evidence should quote or paraphrase the resume line that reveals the skill. Keep it short.
3. Confidence:
   - "high" = used in production work or 1+ years of experience
   - "medium" = used in projects or coursework
   - "low"  = mentioned once or listed without context
4. Extract role from the most recent job title or stated objective.
5. Do not repeat the same skill_name twice.
6. For "company", return "" (empty string) since this is a resume.

Output ONLY valid JSON matching this schema exactly:
{
  "source_type": "resume",
  "source_file": "<filename>",
  "company": "",
  "role": "<inferred role or most recent title>",
  "education": "<highest degree and institution>",
  "projects": ["<short project description>", ...],
  "experience": ["<role at company, duration>", ...],
  "skills": [
    {
      "skill_name": "<concise skill name>",
      "category_code": "<one of the codes above>",
      "evidence": "<resume phrase that shows this skill>",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

// ── Server function ───────────────────────────────────────────────────────────

export const extractResumeSkills = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(50, "Resume text is too short to analyse"),
      fileName: z.string(),
    }),
  )
  .handler(async ({ data: { text, fileName } }): Promise<ParsedSource> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `${SYSTEM_PROMPT}

---

FILE: ${fileName}

RESUME TEXT:
${text.slice(0, 12000)}`;

    let raw: string;
    try {
      const result = await model.generateContent(prompt);
      raw = result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API error: ${msg}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${raw.slice(0, 200)}`);
    }

    const validated = ParsedResumeSchema.safeParse(parsed);
    if (!validated.success) {
      // Best-effort repair
      const partial = parsed as Record<string, unknown>;
      const skills = Array.isArray(partial.skills)
        ? (partial.skills as unknown[])
            .filter((s): s is Skill => {
              const sk = s as Record<string, unknown>;
              return (
                typeof sk.skill_name === "string" &&
                typeof sk.category_code === "string" &&
                VALID_CATEGORY_CODES.includes(sk.category_code as CategoryCode)
              );
            })
            .map((sk) => ({
              skill_name: sk.skill_name,
              category_code: sk.category_code as CategoryCode,
              evidence: typeof sk.evidence === "string" ? sk.evidence : "",
              confidence: (["high", "medium", "low"].includes(sk.confidence as string)
                ? sk.confidence
                : "medium") as Skill["confidence"],
            }))
        : [];

      return {
        source_type: "resume",
        source_file: fileName,
        company: "",
        role: typeof partial.role === "string" ? partial.role : "Unknown",
        education: typeof partial.education === "string" ? partial.education : undefined,
        projects: Array.isArray(partial.projects) ? (partial.projects as string[]) : [],
        experience: Array.isArray(partial.experience) ? (partial.experience as string[]) : [],
        skills,
      };
    }

    return { ...validated.data, source_file: fileName };
  });
