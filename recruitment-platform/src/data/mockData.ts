import type {
  CandidateProfile,
  JobOffer,
  Application,
  ChatSession,
  MatchResult,
  User,
} from '../types'

// ─── Users ────────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    role: 'candidate',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    location: 'San Francisco, CA',
    createdAt: '2024-01-15',
  },
  {
    id: 'u2',
    name: 'Marcus Rodriguez',
    email: 'marcus@techcorp.com',
    role: 'recruiter',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
    company: 'TechCorp Inc.',
    location: 'New York, NY',
    createdAt: '2024-01-10',
  },
  {
    id: 'u3',
    name: 'Admin User',
    email: 'admin@recruitai.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01',
  },
]

// ─── Candidates ───────────────────────────────────────────────────────────────
export const mockCandidates: CandidateProfile[] = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 415 555 0123',
    location: 'San Francisco, CA',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    title: 'Senior Full-Stack Engineer',
    summary:
      'Passionate software engineer with 6+ years of experience building scalable web applications. Expertise in React, Node.js and cloud infrastructure.',
    skills: [
      { name: 'React', level: 'expert', category: 'Frontend' },
      { name: 'TypeScript', level: 'expert', category: 'Language' },
      { name: 'Node.js', level: 'advanced', category: 'Backend' },
      { name: 'Python', level: 'advanced', category: 'Language' },
      { name: 'PostgreSQL', level: 'advanced', category: 'Database' },
      { name: 'AWS', level: 'intermediate', category: 'Cloud' },
      { name: 'Docker', level: 'intermediate', category: 'DevOps' },
      { name: 'GraphQL', level: 'intermediate', category: 'API' },
    ],
    experiences: [
      {
        id: 'e1',
        title: 'Senior Software Engineer',
        company: 'Stripe',
        location: 'San Francisco, CA',
        startDate: '2022-03',
        current: true,
        description:
          'Led development of payment infrastructure serving 10M+ transactions/month. Reduced API latency by 40%.',
      },
      {
        id: 'e2',
        title: 'Software Engineer',
        company: 'Airbnb',
        location: 'San Francisco, CA',
        startDate: '2019-06',
        endDate: '2022-02',
        current: false,
        description:
          'Built host management tools used by 200K+ hosts globally. Migrated monolith to microservices.',
      },
    ],
    education: [
      {
        id: 'ed1',
        degree: 'B.S. Computer Science',
        institution: 'UC Berkeley',
        field: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
        gpa: '3.8',
      },
    ],
    languages: ['English', 'Mandarin', 'French'],
    cvParsed: true,
    linkedIn: 'linkedin.com/in/sarahchen',
    github: 'github.com/sarahchen',
  },
  {
    id: 'c2',
    userId: 'u4',
    name: 'James Okonkwo',
    email: 'james.o@gmail.com',
    phone: '+1 212 555 0456',
    location: 'New York, NY',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    title: 'Machine Learning Engineer',
    summary:
      'ML Engineer specializing in NLP and computer vision. Built production AI systems at scale.',
    skills: [
      { name: 'Python', level: 'expert', category: 'Language' },
      { name: 'PyTorch', level: 'expert', category: 'ML' },
      { name: 'TensorFlow', level: 'advanced', category: 'ML' },
      { name: 'NLP', level: 'expert', category: 'ML' },
      { name: 'React', level: 'intermediate', category: 'Frontend' },
      { name: 'FastAPI', level: 'advanced', category: 'Backend' },
      { name: 'Kubernetes', level: 'intermediate', category: 'DevOps' },
    ],
    experiences: [
      {
        id: 'e3',
        title: 'ML Engineer',
        company: 'OpenAI',
        location: 'Remote',
        startDate: '2023-01',
        current: true,
        description:
          'Fine-tuned LLMs for production use cases. Reduced inference costs by 60%.',
      },
    ],
    education: [
      {
        id: 'ed2',
        degree: 'M.S. Machine Learning',
        institution: 'Carnegie Mellon University',
        field: 'ML & AI',
        startDate: '2019',
        endDate: '2021',
      },
    ],
    languages: ['English', 'Yoruba'],
    cvParsed: true,
  },
  {
    id: 'c3',
    userId: 'u5',
    name: 'Amara Diallo',
    email: 'amara.d@proton.me',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amara',
    title: 'DevOps Engineer',
    summary: 'Cloud-native infrastructure expert with deep Kubernetes and CI/CD expertise.',
    skills: [
      { name: 'Kubernetes', level: 'expert', category: 'DevOps' },
      { name: 'Terraform', level: 'expert', category: 'IaC' },
      { name: 'AWS', level: 'expert', category: 'Cloud' },
      { name: 'Python', level: 'advanced', category: 'Language' },
      { name: 'Go', level: 'intermediate', category: 'Language' },
      { name: 'Prometheus', level: 'advanced', category: 'Monitoring' },
    ],
    experiences: [
      {
        id: 'e4',
        title: 'Senior DevOps Engineer',
        company: 'Datadog',
        location: 'Paris, France',
        startDate: '2021-04',
        current: true,
        description: 'Managed multi-region Kubernetes clusters serving 500M+ metrics/sec.',
      },
    ],
    education: [
      {
        id: 'ed3',
        degree: 'M.Eng. Systems Engineering',
        institution: 'Polytechnique',
        field: 'Systems & Networks',
        startDate: '2017',
        endDate: '2020',
      },
    ],
    languages: ['French', 'English', 'Arabic'],
    cvParsed: true,
  },
  {
    id: 'c4',
    userId: 'u6',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    title: 'Product Designer',
    summary:
      'UX/UI designer with a data-driven approach. Created award-winning experiences for fintech products.',
    skills: [
      { name: 'Figma', level: 'expert', category: 'Design' },
      { name: 'User Research', level: 'expert', category: 'Design' },
      { name: 'Prototyping', level: 'expert', category: 'Design' },
      { name: 'React', level: 'intermediate', category: 'Frontend' },
      { name: 'Accessibility', level: 'advanced', category: 'Design' },
    ],
    experiences: [
      {
        id: 'e5',
        title: 'Lead Product Designer',
        company: 'Razorpay',
        location: 'Bangalore, India',
        startDate: '2020-07',
        current: true,
        description: 'Redesigned payment flow increasing conversion by 23%.',
      },
    ],
    education: [
      {
        id: 'ed4',
        degree: 'B.Des. Interaction Design',
        institution: 'NID Ahmedabad',
        field: 'Design',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    languages: ['English', 'Hindi', 'Kannada'],
    cvParsed: true,
  },
]

// ─── Job Offers ───────────────────────────────────────────────────────────────
export const mockJobOffers: JobOffer[] = [
  {
    id: 'j1',
    title: 'Senior Full-Stack Engineer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA (Hybrid)',
    type: 'hybrid',
    salary: { min: 150000, max: 200000, currency: 'USD' },
    description:
      "Join our core platform team building the next generation of developer tools. You'll own critical infrastructure and ship features used by millions of developers worldwide.",
    requirements: [
      '5+ years of full-stack experience',
      'Strong TypeScript & React skills',
      'Experience with distributed systems',
      'Bachelor\'s in CS or equivalent',
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    experience: '5+ years',
    education: 'Bachelor\'s degree',
    postedAt: '2024-12-01',
    deadline: '2024-12-31',
    status: 'active',
    recruiterId: 'u2',
    applicants: 47,
  },
  {
    id: 'j2',
    title: 'Machine Learning Engineer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    type: 'remote',
    salary: { min: 170000, max: 220000, currency: 'USD' },
    description:
      'Build and deploy ML models at scale. Work closely with research teams to bring cutting-edge models to production.',
    requirements: [
      '3+ years ML engineering experience',
      'Strong Python skills',
      'Experience with LLMs and transformers',
      'ML system design experience',
    ],
    skills: ['Python', 'PyTorch', 'NLP', 'FastAPI', 'Kubernetes', 'MLflow'],
    experience: '3+ years',
    education: 'Master\'s preferred',
    postedAt: '2024-11-25',
    status: 'active',
    recruiterId: 'u2',
    applicants: 83,
  },
  {
    id: 'j3',
    title: 'DevOps Lead',
    company: 'TechCorp Inc.',
    location: 'New York, NY',
    type: 'full-time',
    salary: { min: 140000, max: 180000, currency: 'USD' },
    description:
      'Lead our infrastructure team. Design and implement scalable cloud architecture for our growing platform.',
    requirements: [
      '5+ years DevOps/SRE experience',
      'Expert Kubernetes knowledge',
      'AWS/GCP certifications preferred',
      'Team leadership experience',
    ],
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Python', 'Prometheus', 'Go'],
    experience: '5+ years',
    education: 'Bachelor\'s degree',
    postedAt: '2024-11-20',
    status: 'active',
    recruiterId: 'u2',
    applicants: 29,
  },
]

// ─── Match Results ────────────────────────────────────────────────────────────
export const mockMatchResults: MatchResult[] = [
  {
    candidateId: 'c1',
    jobId: 'j1',
    score: {
      overall: 94,
      skillSimilarity: 96,
      experienceSimilarity: 92,
      educationSimilarity: 88,
      projectSimilarity: 91,
      explanation:
        'Sarah\'s profile is an exceptional match for this role. Her expert-level React and TypeScript skills align perfectly with the requirements. Her experience at Stripe (high-scale payment systems) directly mirrors the technical complexity needed. The only minor gap is limited formal system design portfolio documentation.',
      strengths: [
        'Expert React & TypeScript (exact match)',
        'High-scale distributed system experience',
        'Strong open source contributions',
        'Excellent communication in English',
      ],
      gaps: ['Limited Kubernetes experience', 'No public system design docs'],
    },
    rankedAt: '2024-12-05',
  },
  {
    candidateId: 'c2',
    jobId: 'j2',
    score: {
      overall: 97,
      skillSimilarity: 99,
      experienceSimilarity: 95,
      educationSimilarity: 98,
      projectSimilarity: 93,
      explanation:
        'James is an exceptional match. His OpenAI experience with LLMs is a direct skill match. His CMU Master\'s in ML perfectly satisfies the education preference. Expert NLP skills and PyTorch mastery are exactly what the role needs.',
      strengths: [
        'OpenAI LLM production experience',
        'Expert NLP and PyTorch skills',
        'CMU ML Master\'s degree',
        'Published ML research papers',
      ],
      gaps: ['Limited MLflow exposure'],
    },
    rankedAt: '2024-12-05',
  },
  {
    candidateId: 'c3',
    jobId: 'j3',
    score: {
      overall: 91,
      skillSimilarity: 95,
      experienceSimilarity: 89,
      educationSimilarity: 82,
      projectSimilarity: 87,
      explanation:
        'Amara brings exceptional Kubernetes and Terraform expertise perfectly aligned with the DevOps Lead role. Her multi-region cluster management at Datadog is directly relevant. Leadership experience is somewhat limited but growing.',
      strengths: [
        'Expert Kubernetes & Terraform',
        'Multi-region infrastructure experience',
        'Strong cloud architecture knowledge',
        'Multi-language communication skills',
      ],
      gaps: ['Limited team leadership experience', 'No GCP certification'],
    },
    rankedAt: '2024-12-05',
  },
  {
    candidateId: 'c4',
    jobId: 'j1',
    score: {
      overall: 62,
      skillSimilarity: 55,
      experienceSimilarity: 60,
      educationSimilarity: 70,
      projectSimilarity: 58,
      explanation:
        'Priya is a designer, not a full-stack engineer. While she has some React exposure, her skillset is fundamentally different from this engineering role. Not recommended for this position.',
      strengths: ['Some React knowledge', 'Strong communication skills'],
      gaps: [
        'No backend experience',
        'Limited TypeScript',
        'No cloud/database skills',
        'Design-focused career path',
      ],
    },
    rankedAt: '2024-12-05',
  },
]

// ─── Applications ─────────────────────────────────────────────────────────────
export const mockApplications: Application[] = [
  {
    id: 'a1',
    candidateId: 'c1',
    jobId: 'j1',
    status: 'shortlisted',
    appliedAt: '2024-12-02',
    updatedAt: '2024-12-05',
    matchScore: mockMatchResults[0].score,
  },
  {
    id: 'a2',
    candidateId: 'c1',
    jobId: 'j2',
    status: 'pending',
    appliedAt: '2024-12-03',
    updatedAt: '2024-12-03',
  },
  {
    id: 'a3',
    candidateId: 'c2',
    jobId: 'j2',
    status: 'interview',
    appliedAt: '2024-11-28',
    updatedAt: '2024-12-04',
    matchScore: mockMatchResults[1].score,
  },
]

// ─── Chat Sessions ────────────────────────────────────────────────────────────
export const mockChatSessions: ChatSession[] = [
  {
    id: 'cs1',
    title: 'Best candidates for ML Engineer',
    context: 'recruiter',
    createdAt: '2024-12-05T09:00:00Z',
    updatedAt: '2024-12-05T09:15:00Z',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Show me the best matching candidates for the Machine Learning Engineer position',
        timestamp: '2024-12-05T09:00:00Z',
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'I\'ve analyzed all candidates against the **Machine Learning Engineer** position requirements. Here are the top matches ranked by AI semantic similarity:\n\n**Top match: James Okonkwo** with an exceptional **97% overall score**. His OpenAI experience with production LLMs is a perfect fit. I strongly recommend proceeding to interview.\n\n**Key insights:**\n- Skill similarity: 99% (expert PyTorch, NLP, FastAPI)\n- Experience match: 95% (LLM production at OpenAI)\n- Education: 98% (CMU ML Master\'s)\n\nWould you like me to generate a personalized outreach email for James?',
        timestamp: '2024-12-05T09:00:05Z',
        candidateCards: [mockCandidates[1]],
      },
    ],
  },
  {
    id: 'cs2',
    title: 'CV analysis – Sarah Chen',
    context: 'recruiter',
    createdAt: '2024-12-04T14:00:00Z',
    updatedAt: '2024-12-04T14:20:00Z',
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'Analyze Sarah Chen\'s CV strengths and weaknesses for the Full-Stack role',
        timestamp: '2024-12-04T14:00:00Z',
      },
      {
        id: 'm4',
        role: 'assistant',
        content:
          '**CV Analysis: Sarah Chen → Senior Full-Stack Engineer**\n\n✅ **Strengths:**\n- Expert React & TypeScript (exact requirement match)\n- Stripe experience: high-scale distributed systems directly relevant\n- Strong CS fundamentals from UC Berkeley\n- Multilingual: English, Mandarin, French (global team asset)\n\n⚠️ **Gaps:**\n- Kubernetes experience listed as intermediate only\n- No explicit system design documentation\n\n**Recommendation:** 🟢 Strong hire — proceed to technical interview. Overall AI score: **94/100**',
        timestamp: '2024-12-04T14:00:08Z',
      },
    ],
  },
]

// ─── Analytics ────────────────────────────────────────────────────────────────
export const mockAnalytics = {
  totalUsers: 1247,
  totalCandidates: 892,
  totalRecruiters: 143,
  totalJobs: 312,
  totalApplications: 4823,
  avgMatchScore: 78.4,
  aiEmailsSent: 2341,
  activeSessionsToday: 89,
  weeklyData: [
    { day: 'Mon', applications: 42, matches: 31 },
    { day: 'Tue', applications: 67, matches: 54 },
    { day: 'Wed', applications: 53, matches: 41 },
    { day: 'Thu', applications: 81, matches: 69 },
    { day: 'Fri', applications: 94, matches: 78 },
    { day: 'Sat', applications: 38, matches: 29 },
    { day: 'Sun', applications: 25, matches: 18 },
  ],
  scoreDistribution: [
    { range: '90-100', count: 234 },
    { range: '80-89', count: 412 },
    { range: '70-79', count: 567 },
    { range: '60-69', count: 389 },
    { range: '< 60', count: 241 },
  ],
}
