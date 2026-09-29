import type {
  Candidate,
  JobBoardIntegration,
  JobDescription,
  JobPosting,
  Ratings,
  Source,
  Stage,
  StarQuestion,
  TeamMember,
} from "./types";
import { STAGES } from "./types";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

/** Average sourcing spend per candidate, by channel. Single source of truth for sourcingCost. */
export const costBySource: Record<Source, number> = {
  LinkedIn: 1200,
  Referral: 2500,
  Inbound: 300,
  Agency: 9000,
};

export function buildSeedJobs(): JobPosting[] {
  return [
    {
      id: "job-1",
      title: "Senior Product Designer",
      department: "Design",
      location: "Remote (Global)",
      salary: "€130k – €158k",
      status: "Active",
      postedDate: daysAgo(45),
    },
    {
      id: "job-2",
      title: "Product Designer",
      department: "Design",
      location: "Hybrid (Lisbon)",
      salary: "€75k – €95k",
      status: "Active",
      postedDate: daysAgo(42),
    },
    {
      id: "job-3",
      title: "Design Systems Lead",
      department: "Design",
      location: "Remote (EU)",
      salary: "€120k – €145k",
      status: "Active",
      postedDate: daysAgo(40),
    },
    {
      id: "job-4",
      title: "UX Researcher",
      department: "Design",
      location: "Hybrid (Berlin)",
      salary: "€80k – €100k",
      status: "Active",
      postedDate: daysAgo(38),
    },
    {
      id: "job-5",
      title: "Staff Frontend Engineer — React & TanStack",
      department: "Engineering",
      location: "Hybrid (Berlin / Lisbon)",
      salary: "€140k – €175k",
      status: "Active",
      postedDate: daysAgo(25),
    },
    {
      id: "job-6",
      title: "Head of Product AI",
      department: "Product",
      location: "Remote (US/EU)",
      salary: "$180k – $220k",
      status: "Draft",
      postedDate: daysAgo(10),
    },
  ];
}

export function buildSeedTeam(): TeamMember[] {
  return [
    {
      id: "tm-1",
      name: "Jawadul Hadi",
      email: "jawadulhadicc@gmail.com",
      role: "Owner / Admin",
      department: "Executive",
      status: "Active",
    },
    {
      id: "tm-2",
      name: "Maya Chen",
      email: "maya@talntflow.ai",
      role: "Hiring Manager",
      department: "Design",
      status: "Active",
    },
    {
      id: "tm-3",
      name: "Alex Mercer",
      email: "alex@talntflow.ai",
      role: "Senior Recruiter",
      department: "Talent",
      status: "Active",
    },
    {
      id: "tm-4",
      name: "Sarah Jenkins",
      email: "sarah@talntflow.ai",
      role: "Interviewer",
      department: "Engineering",
      status: "Active",
    },
  ];
}

export function buildSeedIntegrations(): JobBoardIntegration[] {
  return [
    {
      id: "int-google",
      name: "Google Workspace & Sign In",
      category: "Authentication",
      connected: true,
      lastSynced: new Date(Date.now() - 5 * 60_000).toISOString(),
    },
    {
      id: "int-linkedin",
      name: "LinkedIn Talent Solutions",
      category: "Job Board",
      connected: true,
      lastSynced: new Date(Date.now() - 45 * 60_000).toISOString(),
    },
    { id: "int-indeed", name: "Indeed Hiring Platform", category: "Job Board", connected: false },
    { id: "int-greenhouse", name: "Greenhouse ATS", category: "HRIS", connected: false },
    { id: "int-lever", name: "Lever Recruit", category: "HRIS", connected: false },
  ];
}

export function buildSeedRatings(): Record<string, Ratings> {
  return {
    "cand-1": {
      1: { score: 5, note: "Framed an unclear roadmap proactively" },
      2: { score: 4, note: "Empathetic mentorship" },
      3: { score: 5, note: "Resolved PM disagreement with data" },
      4: { score: 4, note: "" },
      5: { score: 3, note: "Pivot story lacked metrics" },
    },
  };
}

export const seedJobDescription: JobDescription = {
  title: "Senior Product Designer — Analytics & Core UI",
  meta: "Remote (Global) · Full-time · €130.000 – €158.000 base + equity",
  overview:
    "Are you a designer who thrives in the space between ambiguity and pixel-perfection? We are looking for a Senior Product Designer to lead the evolution of our core analytics dashboard, turning complex data workflows into effortless, high-clarity interfaces.",
  responsibilities: [
    "Architect data visualisation systems and interactive dashboards for 50.000+ daily active users.",
    "Mentor mid-level and junior designers while setting the standard for UX quality and design system scalability.",
    "Partner with Product and Engineering leadership to ship at high velocity with rigorous QA.",
    "Run user interviews and usability tests, turning qualitative feedback into actionable iterations.",
    "Maintain and extend our multi-brand design token architecture in Figma.",
  ],
  requirements: [
    "5+ years of end-to-end product design in SaaS, B2B or data-intensive software.",
    "Expert Figma skills including variables, advanced auto-layout and multi-tier libraries.",
    "Proven ownership and the ability to navigate ambiguous roadmaps from first principles.",
    "A portfolio showing systemic thinking, complex tables and charts, and measurable impact.",
    "Strong communication and experience facilitating cross-functional alignment.",
  ],
  whyJoinUs:
    "We are a design-led, remote-first team where craft is celebrated. Enjoy competitive equity, flexible autonomy, an annual learning budget and the chance to redefine how teams understand data.",
};

export const starQuestions: StarQuestion[] = [
  {
    id: 1,
    competency: "Ownership",
    weight: 1.3,
    question:
      "Tell me about a project where the roadmap was unclear. How did you define the first step and build momentum?",
    lookFor: "Proactive problem framing; early artefacts that drive consensus.",
    followUp: "What was the biggest assumption you got wrong early on?",
  },
  {
    id: 2,
    competency: "Mentorship",
    weight: 1.0,
    question:
      "Describe a time you gave difficult feedback to a junior designer whose work missed the bar. How was it received?",
    lookFor: "Empathetic yet rigorous critique focused on craft, not the person.",
    followUp: "How did you track their growth over the next three months?",
  },
  {
    id: 3,
    competency: "Conflict resolution",
    weight: 1.2,
    question:
      "Give an example of strongly disagreeing with a PM or engineering lead on a trade-off. How did you resolve it?",
    lookFor: "Anchoring debates in user evidence; compromise without dropping the UX baseline.",
    followUp: "Would you handle that negotiation differently today?",
  },
  {
    id: 4,
    competency: "Complexity",
    weight: 1.2,
    question:
      "What is the most complex data set you have visualised? How did you keep it clear without oversimplifying?",
    lookFor: "Progressive disclosure, visual hierarchy, testing for cognitive load.",
    followUp: "Which edge cases threatened the layout?",
  },
  {
    id: 5,
    competency: "Adaptability",
    weight: 1.0,
    question:
      "Walk me through a time a core design hypothesis failed in testing or after launch. How did you pivot?",
    lookFor: "Intellectual humility and fast synthesis of failure signals.",
    followUp: "How did you communicate the pivot to leadership?",
  },
  {
    id: 6,
    competency: "Strategy",
    weight: 1.1,
    question:
      "If our pricing shifted from seats to usage tomorrow, how would your design philosophy change?",
    lookFor: "Linking UX metrics directly to monetisation and retention.",
    followUp: "Which metric would you watch first?",
  },
  {
    id: 7,
    competency: "Design systems",
    weight: 0.9,
    question:
      "How do you decide between inventing a new component and reusing or refactoring an existing token?",
    lookFor: "Balancing build cost against UX need; component governance.",
    followUp: "Describe a component of yours that broke downstream.",
  },
  {
    id: 8,
    competency: "Collaboration",
    weight: 1.0,
    question:
      "Share a co-design session with engineers where technical constraints improved the final UX.",
    lookFor: "Constraints treated as creative parameters; mutual respect.",
    followUp: "What did you learn from the engineers?",
  },
  {
    id: 9,
    competency: "Prioritisation",
    weight: 1.0,
    question: "Tell me about shipping under a tight deadline. What did you cut and why?",
    lookFor: "Clear scoping of V1 around core user value.",
    followUp: "What happened to the cut scope?",
  },
  {
    id: 10,
    competency: "Change management",
    weight: 0.8,
    question:
      "Describe redesigning a tool people already relied on. How did you manage the transition?",
    lookFor: "Respect for existing mental models; staged rollout and feedback loops.",
    followUp: "How did you measure adoption?",
  },
];

const people: [
  string,
  string,
  Source,
  number,
  NonNullable<Candidate["gender"]>,
  boolean,
  string,
][] = [
  ["Alex Rivera", "Senior Product Designer", "Referral", 94, "Man", true, "Lisbon, PT"],
  ["Priya Natarajan", "Senior Product Designer", "LinkedIn", 91, "Woman", true, "Berlin, DE"],
  ["Jonas Weber", "Product Designer", "Inbound", 78, "Man", false, "Munich, DE"],
  ["Amara Okafor", "Senior Product Designer", "Agency", 86, "Woman", true, "London, UK"],
  ["Lucía Fernández", "Design Systems Lead", "LinkedIn", 83, "Woman", true, "Madrid, ES"],
  ["Tomasz Kowalski", "Product Designer", "Inbound", 72, "Man", false, "Warsaw, PL"],
  ["Sam Lindqvist", "UX Researcher", "Referral", 88, "Non-binary", true, "Stockholm, SE"],
  ["Hugo Martin", "Senior Product Designer", "Agency", 69, "Man", false, "Paris, FR"],
  ["Mei Tanaka", "Design Systems Lead", "Referral", 90, "Woman", true, "Amsterdam, NL"],
  ["Daniel Costa", "Product Designer", "LinkedIn", 75, "Man", false, "Porto, PT"],
  ["Ines Moreau", "UX Researcher", "Inbound", 81, "Woman", false, "Lyon, FR"],
  ["Kwame Mensah", "Senior Product Designer", "LinkedIn", 84, "Man", true, "Dublin, IE"],
];
const stagesFor: Stage[] = [
  "Interviewing",
  "Offer Sent",
  "Screened",
  "Interviewing",
  "Hired",
  "Sourced",
  "Hired",
  "Screened",
  "Interviewing",
  "Sourced",
  "Screened",
  "Offer Sent",
];
const jobIdByRole: Record<string, string> = {
  "Senior Product Designer": "job-1",
  "Product Designer": "job-2",
  "Design Systems Lead": "job-3",
  "UX Researcher": "job-4",
};

export function buildSeedCandidates(): Candidate[] {
  return people.map(([name, role, source, match, gender, urg, location], i) => {
    const stage = stagesFor[i] ?? "Sourced";
    const idx = STAGES.indexOf(stage);
    const start = 40 - i * 2;
    const history = STAGES.slice(0, idx + 1).map((s, k) => ({
      stage: s,
      at: daysAgo(start - k * (4 + (i % 4))),
    }));
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "-");
    return {
      id: `cand-${i + 1}`,
      jobId: jobIdByRole[role] ?? "job-1",
      name,
      role,
      stage,
      matchScore: match,
      appliedDate: history[0]?.at ?? daysAgo(start),
      source,
      sourcingCost: costBySource[source],
      email: `${slug.split("-")[0]}@example.com`,
      phone: `+351 91 ${String(200 + i * 37).padStart(3, "0")} ${String(1000 + i * 113).slice(0, 4)}`,
      gender,
      underrepresented: urg,
      location,
      socials: {
        linkedin: `https://linkedin.com/in/${slug}`,
        ...(i % 2 === 0 ? { github: `https://github.com/${slug}` } : {}),
        portfolio: `https://${slug}.design`,
      },
      skills: [
        { name: "Figma systems", score: 60 + ((match + i * 7) % 40) },
        { name: "Data visualisation", score: 55 + ((match + i * 11) % 45) },
        { name: "User research", score: 50 + ((match + i * 5) % 50) },
      ],
      stageHistory: history,
      comments:
        i < 4
          ? [
              {
                id: `c-${i}`,
                author: "Maya Chen",
                role: "Hiring manager",
                rating: 4,
                text: "Strong portfolio narrative with clear metrics. Worth pushing forward.",
                timestamp: daysAgo(3),
              },
            ]
          : [],
      communications: [
        {
          id: `m-${i}`,
          templateType: "confirm",
          subject: `Application received — ${role}`,
          body: `Hi ${name.split(" ")[0]}, thanks for applying. We will be in touch within five working days.`,
          sentAt: history[0]?.at ?? daysAgo(start),
          status: "Opened",
        },
      ],
      strengths: ["Structured storytelling", "Systems thinking"],
      gaps: i % 3 === 0 ? ["Limited B2B analytics exposure"] : ["Mentorship depth unverified"],
    };
  });
}
