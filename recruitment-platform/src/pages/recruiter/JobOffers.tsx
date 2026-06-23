import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, MapPin, PlusCircle, Check, 
  Sparkles, Wand2, Loader2, Trash2 
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface JobOffer {
  id: string
  title: string
  description: string
  location: string
  work_type: string
  skills: string[]
  requirements: string[]
  created_at: string
}

export function JobOffers() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Creation States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [workType, setWorkType] = useState('hybrid')
  const [skillsStr, setSkillsStr] = useState('')
  const [reqsStr, setReqsStr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AI Extraction States
  const [rawText, setRawText] = useState('')
  const [aiExtracting, setAiExtracting] = useState(false)

  // Fetch recruiter's jobs
  const fetchJobs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/recruiter/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (err) {
      console.error("Error fetching job offers:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [user])

  // Handle job offer deletion
  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to remove this job offer? This will deactivate it instantly.")) return

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Optimistically clean up front-end display array instantly
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId))
      } else {
        const err = await response.json()
        alert(`Could not delete: ${err.detail || 'Internal server error'}`)
      }
    } catch (err) {
      console.error("Failed to delete job offer:", err)
      alert("Network error trying to delete job offer.")
    }
  }

  // Handle standard job offer post
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)

    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
    const requirements = reqsStr.split('\n').map(r => r.trim()).filter(Boolean)

    const jobPayload = {
      recruiter_id: user.id,
      title,
      description,
      parsed_json: {
        position: title,
        company: user.company || "NovaMind Technologies",
        location,
        required_skills: skills,
        responsibilities: requirements,
        remote_policy: workType
      },
      location,
      work_type: workType,
      skills,
      requirements
    }

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload)
      })

      if (response.ok) {
        alert("Job Offer posted successfully with dynamic AI matching vectors!")
        setShowCreateModal(false)
        fetchJobs()
        // Reset
        setTitle('')
        setDescription('')
        setLocation('')
        setSkillsStr('')
        setReqsStr('')
      } else {
        alert("Error posting job offer.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle AI extraction of Job Offer from raw text
  const handleAIExtract = async () => {
    if (!user || !rawText.trim()) return
    setAiExtracting(true)
    try {
      const response = await fetch('/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiter_id: user.id,
          raw_text: rawText,
          position_hint: "AI Specialist",
          company_hint: user.company || "NovaMind Technologies"
        })
      })

      if (response.ok) {
        alert("AI successfully parsed, created, and seeded your job offer with semantic vector embeddings! ✨")
        setShowCreateModal(false)
        setRawText('')
        fetchJobs()
      } else {
        alert("AI Extraction failed. Please fill manually.")
      }
    } catch (err) {
      console.error(err)
      alert("Extraction network failure.")
    } finally {
      setAiExtracting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Job Offers</h1>
          <p className="text-slate-900/40 text-sm mt-1">Post, edit, and optimize your active hiring offers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-slate-900 font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle size={18} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading active offers...</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
          <Briefcase size={32} className="mx-auto mb-3 opacity-30 text-violet-500" />
          <p className="font-semibold text-slate-600">No active job posts yet.</p>
          <p className="text-xs text-slate-400 mt-1">Post a new position manually or use our raw-text AI Extractor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start pr-12">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{job.title}</h3>
                    <p className="text-[11px] font-semibold text-violet-600 tracking-wide uppercase mt-1">
                      {job.work_type}
                    </p>
                  </div>
                </div>

                {/* Corner Status & Actions Wrapper */}
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full border border-emerald-200/50">
                    Active
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteJob(job.id)
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer shadow-sm md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Job Offer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-900/40">
                  <div className="flex items-center gap-1">
                    <MapPin size={13} />
                    <span>{job.location}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Row */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.skills.slice(0, 4).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-md">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Creation Modal with integrated AI Extractor */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Close */}
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors z-10"
              >
                Close
              </button>

              {/* Left Side: Unstructured AI Extractor */}
              <div className="md:col-span-5 space-y-4 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-600">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Quick-Extract</h3>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-normal">
                  Paste any raw unstructured job description text, and let the AI model extract everything, create the job, and deploy semantic search vector embeddings!
                </p>

                <textarea
                  rows={8}
                  placeholder="Paste raw JD description text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-slate-50 text-slate-800 placeholder-slate-400"
                />

                <button
                  type="button"
                  onClick={handleAIExtract}
                  disabled={aiExtracting || !rawText.trim()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white hover:text-violet-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {aiExtracting ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-violet-400" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={13} className="text-violet-400" />
                      <span>AI Auto-Extract & Seed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Side: Manual Form */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Manual Job Creation</h3>
                
                <form onSubmit={handleCreateJob} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Machine Learning Engineer"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Location</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Casablanca, Morocco"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Work Type</label>
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                      >
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the overall role and team responsibilities..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Required Skills (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Python, Machine Learning, FastAPI, PostgreSQL"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-900/40 uppercase block mb-1">Requirements (One per line)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 3+ years experience with LLMs&#10;Degree in Computer Science"
                      value={reqsStr}
                      onChange={(e) => setReqsStr(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-slate-900 hover:scale-[1.01] transition-transform text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-slate-900" />
                        <span>Deploying AI Vectors...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>Post Job Offer</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}