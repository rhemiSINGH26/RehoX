import { createServerFn } from "@tanstack/react-start";
import Groq from "groq-sdk";
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
  name: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  education: z.string().optional(),
  cgpa: z.string().optional(),
  projects: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  internships: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hackathons: z.array(z.string()).optional(),
  preferred_roles: z.array(z.string()).optional(),
  skills: z.array(SkillSchema),
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a talent intelligence engine. Your task is to extract comprehensive structured candidate data from a resume document.

RADIX skill categories (use ONLY these codes):
- COD  : Coding / Programming languages (Python, C++, Java, Go, JS/TS, etc.)
- DSA  : Data Structures & Algorithms
- OOD  : Object-Oriented Design & patterns
- APTI : Quantitative Aptitude / Logical reasoning / Statistics / Math
- COMM : Communication & collaboration / leadership
- AI   : AI / ML / Data Science / BI tools / Analytics
- CLOUD: Cloud platforms (AWS, GCP, Azure, Kubernetes, etc.)
- SQL  : SQL / Databases / Data modeling / NoSQL
- SWE  : Software Engineering practices (CI/CD, testing, Agile, Git)
- SYSD : System Design / Distributed systems / Architecture
- NETW : Networking / Protocols / TCP/IP
- OS   : Operating Systems / Linux / Shell scripting
- OTHER: Anything that does not fit the above

Rules & Approach:
1. Extract the candidate's full NAME and EMAIL if present in the resume.
2. Extract HIGHEST EDUCATION in detail (Degree, Major, Institution, Graduation Year, e.g. "B.Tech Computer Science, IIIT Delhi, 2024").
3. Extract CGPA / GPA / MARKS / PERCENTAGE (e.g. "8.9 / 10 CGPA", "3.8 / 4.0 GPA", "88%"). If present anywhere in education or summary, extract it strictly. If not stated, return "".
4. Infer skills from projects, experience, coursework, and listed skills.
5. Evidence: quote or paraphrase the exact resume phrase revealing the skill (under 80 chars).
6. Confidence:
   - "high" = used in production work, internship, or 1+ years experience
   - "medium" = used in projects or coursework
   - "low"  = mentioned once or listed without context
7. Extract key PROJECTS (short descriptions of main projects).
8. Extract WORK EXPERIENCE and INTERNSHIPS (roles, company, duration).
9. Extract CERTIFICATIONS, HACKATHONS, and PREFERRED ROLES.
10. For "company", return "" (empty string).

Output ONLY valid JSON matching this schema exactly:
{
  "source_type": "resume",
  "source_file": "<filename>",
  "name": "<candidate full name>",
  "email": "<candidate email address>",
  "company": "",
  "role": "<inferred current role or primary title>",
  "education": "<degree, major, university, graduation year>",
  "cgpa": "<extracted CGPA / GPA / percentage or marks>",
  "projects": ["<project title and description>", ...],
  "experience": ["<role, company, duration>", ...],
  "internships": ["<internship role, company>", ...],
  "certifications": ["<certification name>", ...],
  "hackathons": ["<hackathon name/achievement>", ...],
  "preferred_roles": ["<preferred target role>", ...],
  "skills": [
    {
      "skill_name": "<concise skill name>",
      "category_code": "<one of the codes above>",
      "evidence": "<quoted resume phrase>",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

// ── Server function ───────────────────────────────────────────────────────────

export const extractResumeSkills = createServerFn({ method: "POST" })
  .validator(
    z.object({
      text: z.string().min(30, "Resume text is too short to analyse"),
      fileName: z.string(),
    }),
  )
  .handler(async ({ data: { text, fileName } }): Promise<ParsedSource> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
    }

    const groq = new Groq({ apiKey });

    const prompt = `${SYSTEM_PROMPT}

---

FILE: ${fileName}

RESUME TEXT:
${text.slice(0, 15000)}`;

    let raw: string;
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert HR AI assistant that outputs raw JSON strictly matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      raw = completion.choices[0]?.message?.content || "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Groq API error: ${msg}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Groq returned invalid JSON: ${raw.slice(0, 200)}`);
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
        name: typeof partial.name === "string" ? partial.name : "",
        email: typeof partial.email === "string" ? partial.email : "",
        company: "",
        role: typeof partial.role === "string" ? partial.role : "Software Engineer",
        education: typeof partial.education === "string" ? partial.education : undefined,
        cgpa: typeof partial.cgpa === "string" ? partial.cgpa : undefined,
        projects: Array.isArray(partial.projects) ? (partial.projects as string[]) : [],
        experience: Array.isArray(partial.experience) ? (partial.experience as string[]) : [],
        internships: Array.isArray(partial.internships) ? (partial.internships as string[]) : [],
        certifications: Array.isArray(partial.certifications)
          ? (partial.certifications as string[])
          : [],
        hackathons: Array.isArray(partial.hackathons) ? (partial.hackathons as string[]) : [],
        preferred_roles: Array.isArray(partial.preferred_roles)
          ? (partial.preferred_roles as string[])
          : [],
        skills,
      };
    }

    return { ...validated.data, source_file: fileName };
  });
