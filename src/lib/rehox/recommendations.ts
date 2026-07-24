import { CATEGORY_LABEL, type CategoryCode, type SkillsetGapRow } from "./types";

export interface Certification {
  title: string;
  provider: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  url: string;
  category: CategoryCode;
  relevanceReason: string;
}

export interface ResourceLink {
  title: string;
  type: "Documentation" | "Course" | "Interactive Tutorial" | "Book";
  provider: string;
  url: string;
  category: CategoryCode;
}

export interface PracticeProblem {
  title: string;
  platform: "LeetCode" | "HackerRank" | "SystemDesign" | "SQLZoo";
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
  category: CategoryCode;
  companyTags: string[];
  description: string;
}

export interface CareerActionPlan {
  certifications: Certification[];
  resources: ResourceLink[];
  practiceProblems: PracticeProblem[];
}

export interface CompanyStrategy {
  culture: string;
  focusArea: string;
  rounds: { title: string; desc: string }[];
}

export function getCompanyStrategy(companyName: string = "Google"): CompanyStrategy {
  const norm = (companyName || "Google").toLowerCase();
  if (norm.includes("google")) {
    return {
      culture: "Engineering excellence, algorithmic rigor, and large-scale system scalability.",
      focusArea: "Data Structures & Algorithms (Speed & Edge Cases) + Distributed System Design",
      rounds: [
        {
          title: "Round 1: Screening",
          desc: "45-min Live Coding (LeetCode Medium/Hard DSA & Optimization)",
        },
        {
          title: "Round 2 & 3: Coding Deep Dive",
          desc: "Complex Graph Algorithms, Dynamic Programming, Data Structure Design",
        },
        {
          title: "Round 4: System Design",
          desc: "Scalable Architecture (Google Drive, Search Indexer, Global CDN)",
        },
        {
          title: "Round 5: Googleyness & Leadership",
          desc: "Behavioral fit, cross-functional collaboration, ambiguity handling",
        },
      ],
    };
  }
  if (norm.includes("amazon")) {
    return {
      culture: "Customer obsession, ownership, and adherence to 16 Leadership Principles.",
      focusArea:
        "Object-Oriented Design (OOD Patterns) + AWS System Design + Leadership Principles",
      rounds: [
        {
          title: "Round 1: Online Assessment",
          desc: "Debugging + 2 Coding Problems + Work Simulation",
        },
        {
          title: "Round 2 & 3: Technical Coding & OOD",
          desc: "Data Structures + Object-Oriented Design (Parking Lot, Vending Machine)",
        },
        {
          title: "Round 4: System Design",
          desc: "High-throughput cloud architecture (Order processing, Rate Limiter)",
        },
        {
          title: "Round 5: Bar Raiser",
          desc: "Leadership Principles deep dive + technical problem solving",
        },
      ],
    };
  }
  if (norm.includes("meta") || norm.includes("facebook")) {
    return {
      culture: "Move fast, build impact, and produce bug-free high-speed code.",
      focusArea: "Optimal Coding Speed (2 Medium DSA problems in 45 mins) + Product System Design",
      rounds: [
        { title: "Round 1: Initial Screen", desc: "2 LeetCode Medium algorithms in 45 minutes" },
        {
          title: "Round 2 & 3: Speed Coding",
          desc: "Binary trees, graphs, string manipulation, sliding window",
        },
        {
          title: "Round 4: Product Architecture",
          desc: "Designing Messenger, News Feed, or Photo Storage",
        },
        {
          title: "Round 5: Behavioral",
          desc: "Conflict resolution, past project technical trade-offs",
        },
      ],
    };
  }
  if (norm.includes("microsoft")) {
    return {
      culture: "Growth mindset, cloud-first platform engineering, and enterprise reliability.",
      focusArea: "Clean C#/C++/Java Coding + Azure Cloud Services + Pragmatic System Architecture",
      rounds: [
        { title: "Round 1: Screening", desc: "Coding + CS fundamentals overview" },
        {
          title: "Round 2 & 3: Data Structures & Algorithms",
          desc: "Trees, recursion, memory management, array manipulation",
        },
        {
          title: "Round 4: System Design",
          desc: "Enterprise cloud services, microservices, database choice",
        },
        {
          title: "Round 5: As-If Interview (AA)",
          desc: "Senior engineer / Manager fit & technical discussion",
        },
      ],
    };
  }
  if (
    norm.includes("goldman") ||
    norm.includes("oracle") ||
    norm.includes("finance") ||
    norm.includes("bank")
  ) {
    return {
      culture: "High precision, transactional integrity, low latency, and SQL optimization.",
      focusArea: "Advanced SQL + Concurrency/Multithreading + Financial Math & Aptitude",
      rounds: [
        {
          title: "Round 1: Aptitude & Coding",
          desc: "Mathematical reasoning + SQL queries + live coding",
        },
        {
          title: "Round 2: Data Structures & SQL",
          desc: "Complex join queries, indexing, memory efficient DSA",
        },
        {
          title: "Round 3: System Design & Concurrency",
          desc: "Low-latency order book, transactional ACID guarantees",
        },
        {
          title: "Round 4: Executive Fit",
          desc: "Business domain understanding, risk management, and compliance",
        },
      ],
    };
  }
  return {
    culture:
      "Product agility, high quality code craftsmanship, and modern technical stack ownership.",
    focusArea:
      "Core Software Engineering + Modern Frameworks + Scalable API & Database Architecture",
    rounds: [
      { title: "Round 1: Technical Screen", desc: "Live coding & technical background discussion" },
      {
        title: "Round 2: Problem Solving & DSA",
        desc: "Core algorithms, data structures, and clean code practices",
      },
      {
        title: "Round 3: System & API Design",
        desc: "REST/GraphQL API design, database modeling, cloud services",
      },
      {
        title: "Round 4: Culture & Team Fit",
        desc: "Collaborative mindset, engineering philosophy, and communication",
      },
    ],
  };
}

const CERTIFICATION_DATABASE: Record<CategoryCode, Certification[]> = {
  COD: [
    {
      title: "Meta Front-End Developer Professional Certificate",
      provider: "Coursera / Meta",
      level: "Intermediate",
      url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
      category: "COD",
      relevanceReason: "Industry standard for production coding & modern JS/React frameworks.",
    },
    {
      title: "Oracle Certified Professional: Java SE Developer",
      provider: "Oracle",
      level: "Advanced",
      url: "https://education.oracle.com/java-se-developer/trackp_357",
      category: "COD",
      relevanceReason: "Deep OOP, multithreading, and enterprise coding mastery.",
    },
  ],
  DSA: [
    {
      title: "Algorithmic Toolbox & Data Structures Specialization",
      provider: "UC San Diego / Coursera",
      level: "Intermediate",
      url: "https://www.coursera.org/specializations/data-structures-algorithms",
      category: "DSA",
      relevanceReason: "Core algorithm patterns, dynamic programming, and graph theory.",
    },
    {
      title: "Mastering Data Structures & Algorithms",
      provider: "Udemy",
      level: "Intermediate",
      url: "https://www.udemy.com/course/datastructurescnestedc/",
      category: "DSA",
      relevanceReason: "Rigorous memory & time complexity problem solving.",
    },
  ],
  SYSD: [
    {
      title: "AWS Certified Solutions Architect – Professional",
      provider: "Amazon Web Services",
      level: "Advanced",
      url: "https://aws.amazon.com/certification/certified-solutions-architect-professional/",
      category: "SYSD",
      relevanceReason: "Scalable multi-region system design and fault-tolerant architecture.",
    },
    {
      title: "Pragmatic System Design & Distributed Systems",
      provider: "Educative.io",
      level: "Intermediate",
      url: "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers",
      category: "SYSD",
      relevanceReason: "Microservices, caching strategies, rate limiting, and database sharding.",
    },
  ],
  CLOUD: [
    {
      title: "Google Professional Cloud Architect",
      provider: "Google Cloud",
      level: "Advanced",
      url: "https://cloud.google.com/certification/cloud-architect",
      category: "CLOUD",
      relevanceReason: "Enterprise cloud deployment, container orchestration, and security.",
    },
    {
      title: "Certified Kubernetes Administrator (CKA)",
      provider: "Linux Foundation / CNCF",
      level: "Advanced",
      url: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
      category: "CLOUD",
      relevanceReason: "Gold standard for containerized production cluster management.",
    },
  ],
  SQL: [
    {
      title: "PostgreSQL Advanced Administration & Query Optimization",
      provider: "PostgreSQL Academy",
      level: "Intermediate",
      url: "https://www.coursera.org/learn/sql-for-data-science",
      category: "SQL",
      relevanceReason: "Indexing, query execution plan tuning, and transactional ACID design.",
    },
  ],
  AI: [
    {
      title: "Deep Learning Specialization",
      provider: "DeepLearning.AI / Andrew Ng",
      level: "Intermediate",
      url: "https://www.coursera.org/specializations/deep-learning",
      category: "AI",
      relevanceReason: "Neural networks, LLM fine-tuning, and transformer architectures.",
    },
    {
      title: "AWS Certified Machine Learning – Specialty",
      provider: "AWS",
      level: "Advanced",
      url: "https://aws.amazon.com/certification/certified-machine-learning-specialty/",
      category: "AI",
      relevanceReason: "Production AI/ML pipeline engineering and deployment.",
    },
  ],
  OOD: [
    {
      title: "Design Patterns in Object-Oriented Software",
      provider: "Coursera",
      level: "Intermediate",
      url: "https://www.coursera.org/learn/design-patterns",
      category: "OOD",
      relevanceReason: "Gang of Four design patterns and SOLID principles in practice.",
    },
  ],
  APTI: [
    {
      title: "Analytical Reasoning & Problem Solving Masterclass",
      provider: "Pluralsight",
      level: "Beginner",
      url: "https://www.pluralsight.com/",
      category: "APTI",
      relevanceReason: "Structured quantitative analysis and logic puzzles.",
    },
  ],
  COMM: [
    {
      title: "Technical Leadership & Executive Communication",
      provider: "Harvard Online",
      level: "Intermediate",
      url: "https://online.hbs.edu/",
      category: "COMM",
      relevanceReason: "Stakeholder alignment, architecture RFC writing, and team leadership.",
    },
  ],
  SWE: [
    {
      title: "Professional Software Developer Certification",
      provider: "IEEE Computer Society",
      level: "Intermediate",
      url: "https://www.computer.org/education/certifications",
      category: "SWE",
      relevanceReason: "CI/CD pipelines, automated testing, and software lifecycle.",
    },
  ],
  NETW: [
    {
      title: "Cisco Certified Network Associate (CCNA)",
      provider: "Cisco",
      level: "Intermediate",
      url: "https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html",
      category: "NETW",
      relevanceReason: "TCP/IP protocol stack, DNS, BGP, HTTP/3, and load balancers.",
    },
  ],
  OS: [
    {
      title: "Linux Professional Institute LPIC-1",
      provider: "LPI",
      level: "Intermediate",
      url: "https://www.lpi.org/our-certifications/lpic-1-overview",
      category: "OS",
      relevanceReason: "POSIX system calls, process management, and kernel internals.",
    },
  ],
  OTHER: [],
};

const PRACTICE_PROBLEMS_DATABASE: PracticeProblem[] = [
  {
    title: "LRU Cache Implementation",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/lru-cache/",
    category: "DSA",
    companyTags: ["Google", "Amazon", "Meta", "Microsoft", "Uber"],
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache in O(1) time.",
  },
  {
    title: "Design Rate Limiter",
    platform: "SystemDesign",
    difficulty: "Hard",
    url: "https://github.com/donnemartin/system-design-primer#design-a-rate-limiter",
    category: "SYSD",
    companyTags: ["Meta", "Google", "Amazon", "Netflix", "Uber"],
    description:
      "Architect a scalable token-bucket or sliding-window rate limiter for high-traffic API endpoints.",
  },
  {
    title: "Serialize and Deserialize Binary Tree",
    platform: "LeetCode",
    difficulty: "Hard",
    url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    category: "DSA",
    companyTags: ["Google", "Meta", "Microsoft"],
    description:
      "Design an algorithm to serialize a binary tree into a string and deserialize it back.",
  },
  {
    title: "Design Distributed Key-Value Store",
    platform: "SystemDesign",
    difficulty: "Hard",
    url: "https://github.com/donnemartin/system-design-primer",
    category: "SYSD",
    companyTags: ["Amazon", "Google", "Meta", "Apple"],
    description:
      "Architect a distributed Dynamo-style KV store with consistent hashing, quorum replication, and gossip protocol.",
  },
  {
    title: "Department Top Three Salaries (Advanced SQL)",
    platform: "LeetCode",
    difficulty: "Hard",
    url: "https://leetcode.com/problems/department-top-three-salaries/",
    category: "SQL",
    companyTags: ["Meta", "Amazon", "Google", "Uber"],
    description:
      "Write a SQL query using window functions (DENSE_RANK) to find top earners per department.",
  },
  {
    title: "Design Parking Lot (Object-Oriented Design)",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/discuss/interview-question/124739/",
    category: "OOD",
    companyTags: ["Amazon", "Google", "Microsoft"],
    description:
      "Model a multi-level parking lot with spot assignment strategy patterns, inheritance, and clean APIs.",
  },
  {
    title: "Web Crawler Multithreaded",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/web-crawler-multithreaded/",
    category: "COD",
    companyTags: ["Google", "Meta", "Uber"],
    description:
      "Implement a thread-safe web crawler using thread pools, lock-free queues, and URL normalization.",
  },
];

export function generateCareerActionPlan(
  gaps: SkillsetGapRow[],
  targetCompany?: string,
): CareerActionPlan {
  const gapCodes = new Set(gaps.filter((g) => g && g.gap).map((g) => g.category_code));

  // Collect certifications matching gap categories
  const certs: Certification[] = [];
  gapCodes.forEach((code) => {
    const list = CERTIFICATION_DATABASE[code] || [];
    certs.push(...list);
  });

  // Default certs if candidate has very few gaps
  if (certs.length === 0) {
    certs.push(...CERTIFICATION_DATABASE.SYSD, ...CERTIFICATION_DATABASE.CLOUD);
  }

  const safeTarget = (targetCompany || "Google").toLowerCase();

  // Filter practice problems by gap categories & company tags
  const problems = PRACTICE_PROBLEMS_DATABASE.filter((prob) => {
    const categoryMatch = gapCodes.has(prob.category);
    const companyMatch = prob.companyTags.some(
      (c) => c.toLowerCase() === safeTarget || (safeTarget && safeTarget.includes(c.toLowerCase())),
    );
    return categoryMatch || companyMatch;
  });

  // General resource links
  const resources: ResourceLink[] = [
    {
      title: "System Design Primer by Donne Martin",
      type: "Interactive Tutorial",
      provider: "GitHub / Open Source",
      url: "https://github.com/donnemartin/system-design-primer",
      category: "SYSD",
    },
    {
      title: "NeetCode 150 Algorithm Roadmap",
      type: "Interactive Tutorial",
      provider: "NeetCode.io",
      url: "https://neetcode.io/roadmap",
      category: "DSA",
    },
    {
      title: "SQLZoo Interactive SQL Exercises",
      type: "Interactive Tutorial",
      provider: "SQLZoo",
      url: "https://sqlzoo.net/",
      category: "SQL",
    },
  ];

  return {
    certifications: certs.slice(0, 4),
    resources,
    practiceProblems: (problems.length > 0 ? problems : PRACTICE_PROBLEMS_DATABASE).slice(0, 5),
  };
}
