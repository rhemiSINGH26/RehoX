import { createServerFn } from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { ParsedSource, Skill, CategoryCode } from "./types";

// ── Zod schema matching the shared data contract ────────────────────────────

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

const ParsedSourceSchema = z.object({
  source_type: z.literal("jd"),
  source_file: z.string(),
  company: z.string(),
  role: z.string(),
  skills: z.array(SkillSchema),
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a talent intelligence engine. Your task is to extract a structured skill list from a Job Description (JD).

RADIX skill categories (use ONLY these codes):
- COD  : Coding / Programming languages
- DSA  : Data Structures & Algorithms
- OOD  : Object-Oriented Design & patterns
- APTI : Quantitative Aptitude / Logical reasoning / Statistics
- COMM : Communication & collaboration
- AI   : AI / ML / Data Science / BI tools
- CLOUD: Cloud platforms (AWS, GCP, Azure, etc.)
- SQL  : SQL / Databases / Data modeling
- SWE  : Software Engineering practices (CI/CD, testing, Agile, SDLC)
- SYSD : System Design / Distributed systems / Architecture
- NETW : Networking / Protocols
- OS   : Operating Systems / Linux / Kernel / Shell
- OTHER: Anything that does not fit the above

Rules:
1. Map skills to categories by meaning, not just keywords. "Build fault-tolerant pipelines" → SYSD.
2. Focus on "Key Responsibilities" and "What We're Looking For" sections — they carry the strongest signal.
3. Use evidence: quote the exact JD phrase that reveals the skill. Keep it short (under 80 chars).
4. Confidence:
   - "high" = explicitly stated as required/must-have
   - "medium" = implied or preferred
   - "low"  = nice-to-have or vaguely mentioned
5. Named technologies count as skills (e.g., "Kubernetes" → CLOUD, "Redis" → SQL/COD by context).
6. Do not repeat the same skill_name twice.

Output ONLY valid JSON matching this schema exactly:
{
  "source_type": "jd",
  "source_file": "<filename>",
  "company": "<company name or 'Unknown'>",
  "role": "<role title>",
  "skills": [
    {
      "skill_name": "<concise skill name>",
      "category_code": "<one of the codes above>",
      "evidence": "<quoted JD phrase>",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

// ── Server function ───────────────────────────────────────────────────────────

export const extractJdSkills = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(50, "JD text is too short to analyse"),
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
        temperature: 0.1, // low temp for structured extraction
        maxOutputTokens: 2048,
      },
    });

    const prompt = `${SYSTEM_PROMPT}

---

FILE: ${fileName}

JD TEXT:
${text.slice(0, 12000)}`; // cap at ~12 k chars to stay within free-tier limits

    let raw: string;
    try {
      const result = await model.generateContent(prompt);
      raw = result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API error: ${msg}`);
    }

    // Parse and validate the JSON response
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${raw.slice(0, 200)}`);
    }

    const validated = ParsedSourceSchema.safeParse(parsed);
    if (!validated.success) {
      // Attempt a best-effort repair — return what we have with the fileName injected
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
        source_type: "jd",
        source_file: fileName,
        company: typeof partial.company === "string" ? partial.company : "Unknown",
        role: typeof partial.role === "string" ? partial.role : "Unknown",
        skills,
      };
    }

    // Inject the real fileName (Gemini might hallucinate it)
    return { ...validated.data, source_file: fileName };
  });
