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

export const SAMPLE_JD_TEXTS: Record<string, { company: string; role: string; text: string }> = {
  "google_swe.pdf": {
    company: "Google",
    role: "Software Engineer",
    text: `Job Description: Software Engineer - Google
Company: Google
Role: Software Engineer

About the Role:
As a Software Engineer at Google, you will develop core infrastructure, large-scale distributed systems, and user-facing applications. 

Key Responsibilities:
- Design, test, deploy, and maintain large-scale distributed systems and software applications.
- Build fault-tolerant pipelines and high-availability backend services.
- Write clean, maintainable production code following object-oriented design patterns.
- Collaborate across cross-functional teams and time zones to deliver high-quality technical solutions.

What We're Looking For:
- Strong grasp of core Data Structures and Algorithms (DSA).
- Proficiency in at least one object-oriented or systems programming language such as C++, Java, or Python.
- Deep understanding of Operating System (OS) internals, memory management, and Linux environment.
- Demonstrated experience in Object-Oriented Design (OOD) and distributed systems architecture.
- Excellent written and verbal communication skills.`
  },
  "google_ds.pdf": {
    company: "Google",
    role: "Data Scientist",
    text: `Job Description: Data Scientist - Google
Company: Google
Role: Data Scientist

About the Role:
We are seeking an analytical Data Scientist to turn massive datasets into actionable insights and machine learning models for core Google products.

Key Responsibilities:
- Extract, clean, and analyze petabyte-scale data stored in distributed SQL databases and Google Cloud Platform (GCP).
- Develop applied Machine Learning (ML) models and statistical algorithms for product feature optimization.
- Perform rigorous statistical testing, hypothesis validation, and quantitative aptitude modeling.
- Translate technical analytical findings into compelling presentations for leadership and non-technical stakeholders.

What We're Looking For:
- Fluent in Python (pandas, numpy, scikit-learn) for data analysis and modeling.
- Advanced SQL proficiency against large-scale enterprise data warehouses.
- Strong foundation in Applied Machine Learning, Deep Learning, and Artificial Intelligence (AI).
- Experience working with Cloud Platforms (GCP, AWS, or Azure).
- Exceptional communication skills to present insights clearly.`
  },
  "microsoft_swe.pdf": {
    company: "Microsoft",
    role: "Software Engineer",
    text: `Job Description: Software Engineer - Microsoft
Company: Microsoft
Role: Software Engineer

About the Role:
Join Microsoft Cloud & AI team to build mission-critical enterprise services powering Microsoft Azure and .NET ecosystem.

Key Responsibilities:
- Architect, build, and maintain scalable cloud services running on Microsoft Azure.
- Implement robust C#/.NET microservices with high reliability and low latency.
- Work closely in an Agile software engineering environment with modern CI/CD pipelines and automated testing.
- Design database schemas and query patterns using Microsoft SQL Server.

What We're Looking For:
- Strong proficiency in C# and .NET technology stack.
- Hands-on experience with Microsoft Azure cloud services.
- Solid understanding of Distributed Systems design, API development, and solid DSA fundamentals.
- Practical experience with relational databases, specifically SQL Server.
- Familiarity with modern Software Engineering (SWE) practices including Git, CI/CD, and unit testing.`
  },
  "microsoft_da.pdf": {
    company: "Microsoft",
    role: "Data Analyst",
    text: `Job Description: Data Analyst - Microsoft
Company: Microsoft
Role: Data Analyst

About the Role:
Microsoft is looking for a Data Analyst to drive business reporting and business intelligence dashboards for executive decision making.

Key Responsibilities:
- Write complex SQL queries and data integration scripts to create automated reporting pipelines.
- Build interactive Power BI dashboards and visual analytics reports for leadership.
- Analyze large numerical datasets to derive strategic insights using quantitative aptitude and statistics.
- Translate business requirements into technical metrics and communicate data-driven insights.

What We're Looking For:
- Expert-level SQL skills for querying and data manipulation.
- Extensive experience building executive dashboards in Power BI.
- Strong numerical aptitude, statistical analysis, and Excel mastery.
- Excellent communication skills to work across cross-functional teams.
- Familiarity with Azure Data services (Synapse, Data Factory) is a plus.`
  },
  "ofss_ase.pdf": {
    company: "Oracle Financial Services Software",
    role: "Associate Software Engineer",
    text: `Job Description: Associate Software Engineer - Oracle Financial Services Software
Company: Oracle Financial Services Software
Role: Associate Software Engineer

About the Role:
Join OFSS as an Associate Software Engineer to build and enhance enterprise core banking products like Oracle FLEXCUBE.

Key Responsibilities:
- Develop, debug, and maintain banking domain software modules written in Java.
- Write advanced Oracle PL/SQL stored procedures, triggers, and relational database queries.
- Follow object-oriented design principles to structure complex financial software solutions.
- Adhere to rigorous software engineering (SWE) methodologies, code reviews, and SDLC guidelines.

What We're Looking For:
- Strong programming fundamentals in Java on core frameworks.
- Advanced knowledge of Oracle SQL and PL/SQL.
- Solid understanding of Object-Oriented Design (OOD) in banking software.
- High quantitative aptitude and analytical thinking.
- Good verbal and written communication skills for client-facing interaction.`
  },
  "ofss_asa.pdf": {
    company: "Oracle Financial Services Software",
    role: "Application Support Analyst",
    text: `Job Description: Application Support Analyst - Oracle Financial Services Software
Company: Oracle Financial Services Software
Role: Application Support Analyst

About the Role:
OFSS is hiring an Application Support Analyst to provide high-availability L2/L3 support and system troubleshooting for core financial solutions.

Key Responsibilities:
- Diagnose, triage, and resolve production system issues using complex SQL queries and database inspection.
- Execute shell scripts and command-line utilities on Unix/Linux server environments.
- Monitor networking protocols and banking infrastructure topologies to ensure SLA compliance.
- Coordinate directly with client teams under high pressure to resolve critical incidents.

What We're Looking For:
- Hands-on comfort with Unix/Linux operating system commands and shell scripting.
- Strong SQL diagnostic and querying skills.
- Basic understanding of networking protocols and infrastructure topologies.
- Ability to read and patch existing Java code modules.
- Logical debugging aptitude and strong client-facing communication skills.`
  }
};

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
