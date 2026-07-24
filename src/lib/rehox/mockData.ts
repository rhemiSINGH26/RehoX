import type { ParsedSource, Skill, CategoryCode } from "./types";

const s = (
  skill_name: string,
  category_code: CategoryCode,
  evidence: string,
  confidence: Skill["confidence"] = "high",
): Skill => ({ skill_name, category_code, evidence, confidence });

export const SAMPLE_JDS: ParsedSource[] = [
  {
    source_type: "jd",
    source_file: "google_swe.pdf",
    company: "Google",
    role: "Software Engineer",
    skills: [
      s("Data Structures", "DSA", '"Strong grasp of core data structures and algorithms."'),
      s("C++/Java/Python", "COD", '"Proficient in at least one of C++, Java, Python."'),
      s("System Design", "SYSD", '"Design and build large-scale distributed systems."'),
      s("Operating Systems", "OS", '"Deep understanding of OS internals preferred."', "medium"),
      s("Object-Oriented Design", "OOD", '"Clean OO design in production code."'),
      s("Communication", "COMM", '"Collaborate across teams and time zones."', "medium"),
    ],
  },
  {
    source_type: "jd",
    source_file: "google_ds.pdf",
    company: "Google",
    role: "Data Scientist",
    skills: [
      s("Python", "COD", '"Fluent in Python for analysis."'),
      s("SQL", "SQL", '"Advanced SQL against petabyte-scale warehouses."'),
      s("Machine Learning", "AI", '"Applied ML for product features."'),
      s("Statistics", "APTI", '"Rigorous statistical reasoning."'),
      s("Cloud Platforms", "CLOUD", '"Experience with GCP or equivalent."', "medium"),
      s("Communication", "COMM", '"Present findings to non-technical stakeholders."'),
    ],
  },
  {
    source_type: "jd",
    source_file: "microsoft_swe.pdf",
    company: "Microsoft",
    role: "Software Engineer",
    skills: [
      s("C#/.NET", "COD", '"C#/.NET on the Azure stack."'),
      s("Azure", "CLOUD", '"Design services running on Azure."'),
      s("Distributed Systems", "SYSD", '"Build reliable distributed services."'),
      s("SQL Server", "SQL", '"Model data in SQL Server."', "medium"),
      s("Agile SWE", "SWE", '"Ship in an agile team with strong CI/CD."'),
      s("Data Structures", "DSA", '"Solid DSA fundamentals."', "medium"),
    ],
  },
  {
    source_type: "jd",
    source_file: "microsoft_da.pdf",
    company: "Microsoft",
    role: "Data Analyst",
    skills: [
      s("SQL", "SQL", '"Expert SQL for reporting pipelines."'),
      s("Power BI", "AI", '"Build Power BI dashboards."', "medium"),
      s("Excel / Aptitude", "APTI", '"Numerical reasoning across large datasets."'),
      s("Communication", "COMM", '"Translate data into decisions."'),
      s("Azure Data", "CLOUD", '"Familiarity with Azure Synapse a plus."', "low"),
    ],
  },
  {
    source_type: "jd",
    source_file: "ofss_ase.pdf",
    company: "Oracle Financial Services Software",
    role: "Associate Software Engineer",
    skills: [
      s("Java", "COD", '"Java on the FLEXCUBE stack."'),
      s("Oracle SQL / PL-SQL", "SQL", '"Advanced PL/SQL for banking modules."'),
      s("OOD", "OOD", '"Object-oriented modeling of banking domain."'),
      s("SWE Practices", "SWE", '"Follow SDLC and code-review discipline."'),
      s("Communication", "COMM", '"Client-facing communication skills."'),
      s("Aptitude", "APTI", '"Quantitative aptitude for financial products."'),
    ],
  },
  {
    source_type: "jd",
    source_file: "ofss_asa.pdf",
    company: "Oracle Financial Services Software",
    role: "Application Support Analyst",
    skills: [
      s("SQL", "SQL", '"Diagnose issues with SQL queries."'),
      s("Unix/Linux", "OS", '"Comfortable on Linux shells."'),
      s("Networking", "NETW", '"Understand basic banking network topology."', "medium"),
      s("Communication", "COMM", '"Coordinate with clients under pressure."'),
      s("Aptitude", "APTI", '"Logical debugging under SLA."'),
      s("Java basics", "COD", '"Read/patch existing Java modules."', "medium"),
    ],
  },
];

export interface SampleResume extends ParsedSource {
  persona: string;
  displayName: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    persona: "Systems-leaning generalist",
    displayName: "Aarav Menon — Systems generalist",
    source_type: "resume",
    source_file: "aarav_menon_resume.pdf",
    company: "",
    role: "New grad — backend",
    education: "B.Tech CSE, NIT Trichy, 2024 — CGPA 8.6",
    projects: [
      "Built a distributed key-value store in Go with Raft consensus",
      "Contributed to an open-source Linux syscall tracer",
    ],
    experience: ["SDE Intern, mid-size fintech — 6 months on payments infra"],
    skills: [
      s("C++", "COD", "3 years, competitive programming"),
      s("Go", "COD", "backend services", "medium"),
      s("Data Structures", "DSA", "600+ problems solved"),
      s("Distributed Systems", "SYSD", "Raft KV store project"),
      s("Linux internals", "OS", "syscall tracer contribution"),
      s("Networking", "NETW", "TCP/IP fundamentals", "medium"),
      s("OOD", "OOD", "coursework and side projects", "medium"),
      s("Communication", "COMM", "tech talks at college club", "medium"),
    ],
  },
  {
    persona: "Data-leaning analyst",
    displayName: "Priya Shah — Data analyst",
    source_type: "resume",
    source_file: "priya_shah_resume.pdf",
    company: "",
    role: "Data Analyst",
    education: "M.Sc Statistics, University of Mumbai, 2023",
    projects: [
      "Customer churn model for a D2C brand (Python, sklearn)",
      "Sales dashboard suite in Power BI",
    ],
    experience: ["Analyst, D2C retail startup — 1.5 years, SQL-heavy reporting"],
    skills: [
      s("SQL", "SQL", "1.5 years production reporting"),
      s("Python (pandas)", "COD", "daily use"),
      s("Statistics", "APTI", "M.Sc coursework"),
      s("Power BI", "AI", "dashboard delivery", "medium"),
      s("Machine Learning", "AI", "churn model shipped", "medium"),
      s("Communication", "COMM", "weekly stakeholder readouts"),
      s("Azure basics", "CLOUD", "one project on Synapse", "low"),
    ],
  },
  {
    persona: "Entry-level support-oriented",
    displayName: "Rohit Kulkarni — Support engineer",
    source_type: "resume",
    source_file: "rohit_kulkarni_resume.pdf",
    company: "",
    role: "Application Support",
    education: "B.E. IT, VIT Pune, 2025",
    projects: [
      "Lab: end-to-end banking transaction simulator",
      "Shell scripts for automated log triage",
    ],
    experience: ["Support intern, small SaaS — 4 months on L1/L2 tickets"],
    skills: [
      s("SQL", "SQL", "intern reporting queries", "medium"),
      s("Linux shell", "OS", "log triage scripts"),
      s("Networking", "NETW", "college coursework", "medium"),
      s("Communication", "COMM", "client tickets", "medium"),
      s("Java basics", "COD", "banking simulator project", "medium"),
      s("Aptitude", "APTI", "regular practice", "medium"),
    ],
  },
  {
    persona: "Strong all-rounder",
    displayName: "Ananya Rao — Strong all-rounder",
    source_type: "resume",
    source_file: "ananya_rao_resume.pdf",
    company: "",
    role: "Software Engineer",
    education: "B.Tech CSE, BITS Pilani, 2024 — CGPA 9.1",
    projects: [
      "Realtime collab editor (WebSockets, CRDTs)",
      "ML side project: resume-to-role recommender",
    ],
    experience: ["SDE Intern, big tech — 6 months on cloud platform team"],
    skills: [
      s("Java", "COD", "primary language"),
      s("Python", "COD", "ML side projects"),
      s("Data Structures", "DSA", "800+ problems"),
      s("OOD", "OOD", "internship codebase"),
      s("System Design", "SYSD", "collab editor architecture"),
      s("Machine Learning", "AI", "recommender project", "medium"),
      s("Cloud (AWS)", "CLOUD", "internship on AWS"),
      s("SQL", "SQL", "postgres in internship"),
      s("SWE Practices", "SWE", "code reviews, CI/CD"),
      s("Communication", "COMM", "tech lead in hackathons"),
      s("Aptitude", "APTI", "consistent test scores"),
    ],
  },
];
