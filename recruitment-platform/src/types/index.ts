// ─── Auth ────────────────────────────────────────────────────────────────────
export type Role = 'candidate' | 'recruiter' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  company?: string
  location?: string
  createdAt: string
}

// ─── CV / Candidate ───────────────────────────────────────────────────────────
export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
}

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  degree: string
  institution: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

export interface CandidateProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  location: string
  avatar?: string
  title: string
  summary: string
  skills: Skill[]
  experiences: Experience[]
  education: Education[]
  languages: string[]
  cvParsed: boolean
  cvUrl?: string
  linkedIn?: string
  github?: string
  portfolio?: string
}

// ─── Job Offers ───────────────────────────────────────────────────────────────
export interface JobOffer {
  id: string
  title: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid'
  salary?: { min: number; max: number; currency: string }
  description: string
  requirements: string[]
  skills: string[]
  experience: string
  education: string
  postedAt: string
  deadline?: string
  status: 'active' | 'paused' | 'closed'
  recruiterId: string
  applicants: number
}

// ─── Matching ─────────────────────────────────────────────────────────────────
export interface MatchScore {
  overall: number
  skillSimilarity: number
  experienceSimilarity: number
  educationSimilarity: number
  projectSimilarity: number
  explanation: string
  strengths: string[]
  gaps: string[]
}

export interface MatchResult {
  candidateId: string
  jobId: string
  score: MatchScore
  rankedAt: string
}

// ─── Applications ─────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'rejected'

export interface Application {
  id: string
  candidateId: string
  jobId: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  matchScore?: MatchScore
  notes?: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  candidateCards?: CandidateProfile[]
  emailPreview?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  context?: 'candidate' | 'recruiter'
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsStat {
  label: string
  value: number | string
  change: number
  changeType: 'increase' | 'decrease'
  icon: string
}
