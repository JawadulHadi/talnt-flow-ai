export const STAGES = ["Sourced", "Screened", "Interviewing", "Offer Sent", "Hired"] as const;
export type Stage = (typeof STAGES)[number];

export const SOURCES = ["LinkedIn", "Referral", "Inbound", "Agency"] as const;
export type Source = (typeof SOURCES)[number];

export type EmailTemplate = "confirm" | "reminder" | "feedback" | "offer" | "rejection";

export const GENDERS = ["Woman", "Man", "Non-binary"] as const;
export type Gender = (typeof GENDERS)[number];

export const REJECTION_REASONS = [
  "Skills mismatch",
  "Experience level",
  "Salary expectations",
  "Withdrew",
  "Position filled",
  "Other",
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export interface CandidateComment {
  id: string;
  author: string;
  role: string;
  rating: number;
  text: string;
  timestamp: string;
}

export interface CandidateEmailLog {
  id: string;
  templateType: EmailTemplate;
  subject: string;
  body: string;
  sentAt: string;
  status: "Sent" | "Scheduled" | "Opened";
}

export interface StageMove {
  stage: Stage;
  at: string;
}

export interface Candidate {
  id: string;
  /** Requisition this application belongs to. */
  jobId: string;
  name: string;
  /** Job title at the time of application (denormalised for display). */
  role: string;
  stage: Stage;
  matchScore: number;
  appliedDate: string;
  source: Source;
  sourcingCost: number;
  email: string;
  phone?: string;
  location?: string;
  /** Voluntary EEO self-identification. Undefined means "not disclosed". */
  gender?: Gender;
  underrepresented?: boolean;
  resumeFileName?: string;
  rejection?: { reason: RejectionReason; at: string };
  socials: { linkedin?: string; github?: string; portfolio?: string };
  skills: { name: string; score: number }[];
  stageHistory: StageMove[];
  comments: CandidateComment[];
  communications: CandidateEmailLog[];
  strengths: string[];
  gaps: string[];
}

export interface StarQuestion {
  id: number;
  competency: string;
  weight: number;
  question: string;
  lookFor: string;
  followUp: string;
}

export interface Rating {
  score: number;
  note: string;
}

export type Ratings = Record<number, Rating>;

export interface Recommendation {
  verdict: "Strong hire" | "Hire" | "Lean hire" | "No hire";
  weightedScore: number;
  executiveSummary: string;
  keyStrengths: string[];
  areasToProbe: string[];
  generatedBy: "ai" | "fallback";
}

export interface JobDescription {
  title: string;
  meta: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  whyJoinUs: string;
}

export const THEMES = ["frosted-slate", "frosted-ember", "paper-light", "signal-emerald"] as const;
export type ThemeName = (typeof THEMES)[number];

export const JOB_STATUSES = ["Active", "Draft", "Closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  status: JobStatus;
  /** ISO timestamp. */
  postedDate: string;
}

export const TEAM_ROLES = [
  "Owner / Admin",
  "Hiring Manager",
  "Senior Recruiter",
  "Interviewer",
] as const;

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: (typeof TEAM_ROLES)[number];
  department: string;
  status: "Active" | "Pending";
}

export interface JobBoardIntegration {
  id: string;
  name: string;
  category: "Authentication" | "Job Board" | "HRIS";
  connected: boolean;
  /** ISO timestamp of the last successful connection. */
  lastSynced?: string;
}
