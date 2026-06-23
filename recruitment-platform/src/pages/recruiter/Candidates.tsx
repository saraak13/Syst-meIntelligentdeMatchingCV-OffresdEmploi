import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Save } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface Applicant {
  id: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  jobId: string
  jobTitle: string
  cvId: string | null
  cvParsedSkills: string[]
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'offered' | 'rejected'
  coverLetter: string | null
  recruiterNotes: string | null
  matchScore?: number
  appliedAt: string
  updatedAt: string
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  reviewed: { label: 'Under Review', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  shortlisted: { label: 'Shortlisted', color: 'bg-violet-500/20 text-violet-600 border-violet-500/30' },
  interview: { label: 'Interview Scheduled', color: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30' },
  offered: { label: 'Offer Received', color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Not Selected', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
}

export function Candidates() {
  const { user } = useAuth()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeNotes, setActiveNotes] = useState<{ [appId: string]: string }>({})

  // 1. Fetch live applicants from backend
  const fetchApplicants = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await fetch(`/api/applications/recruiter/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setApplicants(data)
        
        // Initialize editable notes
        const notesObj: { [appId: string]: string } = {}
        data.forEach((app: Applicant) => {
          notesObj[app.id] = app.recruiterNotes || ''
        })
        setActiveNotes(notesObj)
      }
    } catch (err) {
      console.error("Error fetching recruiter applicants:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplicants()
  }, [user])

  // 2. Handle status modification
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus as any } : a))
      } else {
        alert("Failed to update applicant status.")
      }
    } catch (err) {
      console.error("Network error updating status:", err)
    }
  }

  // 3. Save recruiter comments
  const handleSaveNotes = async (appId: string) => {
    const noteText = activeNotes[appId] || ''
    try {
      const response = await fetch(`/api/applications/${appId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText })
      })
      if (response.ok) {
        alert("Recruiter comments saved successfully!")
      } else {
        alert("Could not update notes.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredApplicants = applicants.filter(app => {
    const matchesJob = selectedJobId === 'all' || app.jobId === selectedJobId
    const matchesSearch = app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesJob && matchesSearch
  })

  // Group job offers for dropdown
  const jobsList = Array.from(
    new Map(applicants.map(app => [app.jobId, app.jobTitle])).entries()
  ).map(([id, title]) => ({ id, title }))

  return (
    <div className="space-y-6 max-w-5xl p-4 bg-white min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Manage Candidates</h1>
        <p className="text-slate-900/40 text-sm mt-1">Review live applications, check matching scores, and update candidate statuses</p>
      </motion.div>

      {/* Dynamic Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex flex-1 gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search candidate or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-900 placeholder-slate-400 shadow-sm"
            />
          </div>

          {/* Job Filter Dropdown */}
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-900 shadow-sm font-medium cursor-pointer"
          >
            <option value="all">All Jobs</option>
            {jobsList.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading applicants...</div>
      ) : filteredApplicants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          No applicants match your current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplicants.map((app) => {
            const config = statusConfig[app.status] || statusConfig['pending']
            const matchScore = app.matchScore ?? 70

            return (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between relative overflow-hidden"
              >
                {/* Visual matching score gradient indicator line */}
                <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-600" style={{ width: `${matchScore}%` }} />

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">{app.candidateName}</h3>
                    <span className="text-xs text-slate-900/30">applied for</span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 max-w-xs truncate">
                      {app.jobTitle}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-900/40">{app.candidateEmail}</p>

                  {/* Badges for skills parsed from CV */}
                  {app.cvParsedSkills && app.cvParsedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.cvParsedSkills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-100 rounded-md">
                          {skill}
                        </span>
                      ))}
                      {app.cvParsedSkills.length > 5 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                          +{app.cvParsedSkills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recruiter Notes Area */}
                  <div className="pt-3 w-full max-w-lg space-y-2">
                    <label className="text-[11px] font-semibold text-slate-900/40 uppercase tracking-wider block">
                      Recruiter Notes / Message to Candidate
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        rows={1}
                        placeholder="Add notes/messages here (candidate will see this in their portal)..."
                        value={activeNotes[app.id] || ''}
                        onChange={(e) => setActiveNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50 text-slate-800 placeholder-slate-400"
                      />
                      <button
                        onClick={() => handleSaveNotes(app.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 flex items-center justify-center transition-colors shrink-0"
                        title="Save notes and send message"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pipeline Controls */}
                <div className="flex flex-col sm:items-end gap-4 self-stretch justify-between shrink-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* AI Score Badge */}
                    <div className="px-3 py-1 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-violet-600 uppercase">AI Match</span>
                      <span className="text-xs font-black text-violet-600">{matchScore}%</span>
                    </div>

                    {/* Status Dropdown Tracker Setup */}
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className={cn(
                        'px-3 py-1 text-xs font-semibold rounded-full border focus:outline-none transition-colors cursor-pointer bg-white text-slate-900',
                        config.color
                      )}
                    >
                      <option value="pending">Pending Review</option>
                      <option value="reviewed">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}