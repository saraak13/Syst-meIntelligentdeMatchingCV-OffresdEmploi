import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, AlertCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { JobCard } from '../../components/shared/JobCard'

import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function JobMatchesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [noCv, setNoCv] = useState(false)
  const [appliedList, setAppliedList] = useState<string[]>([])
  const [cvId, setCvId] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  const fetchAppliedJobs = async () => {
    if (!user) return

    try {
      const appRes = await fetch(`/api/applications/candidate/${user.id}`)
      if (appRes.ok) {
        const pgApps = await appRes.json()
        setAppliedList(pgApps.map((a: any) => a.jobId))
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  useEffect(() => {
    if (!user) return

    const fetchCvAndApps = async () => {
      try {
        const cvRes = await fetch(`/api/cvs/user/${user.id}`)
        if (cvRes.ok) {
          const cvData = await cvRes.json()
          if (cvData?.id) {
            setCvId(cvData.id)
          }
        }
      } catch (err) {
        console.error('Error fetching CV:', err)
      }

      await fetchAppliedJobs()
    }

    // 3. Fetch Job Matches
    const fetchMatches = async () => {
      setLoading(true)
      setNoCv(false)
      try {
        const response = await fetch(`/api/matching/top-jobs/${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setJobs(data)
          if (data.length > 0) {
            setSelected(data[0])
          }
        } else if (response.status === 404) {
          setNoCv(true)
        }
      } catch (err) {
        console.error("Error fetching job matches:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCvAndApps()
    fetchMatches()
  }, [user])

  const resolveJobOfferId = (jobOffer: any) =>
    jobOffer.job_offer_id || jobOffer.job_id || jobOffer.id

  const handleApplyJob = async (jobOffer: any) => {
    if (!user || !jobOffer || applying) return

    const jobOfferId = resolveJobOfferId(jobOffer)
    if (!jobOfferId) {
      alert('Could not apply: missing job identifier.')
      return
    }

    if (appliedList.includes(jobOfferId)) {
      alert('You have already applied to this job.')
      return
    }

    setApplying(true)
    try {
      let activeCvId = cvId
      if (!activeCvId) {
        const cvRes = await fetch(`/api/cvs/user/${user.id}`)
        if (cvRes.ok) {
          const cvData = await cvRes.json()
          activeCvId = cvData?.id ?? null
          if (activeCvId) setCvId(activeCvId)
        }
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: user.id,
          job_offer_id: jobOfferId,
          cv_id: activeCvId,
          cover_letter: 'Tailored application with AI parsed profile details.'
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const detail = typeof err.detail === 'string' ? err.detail : 'Internal server error'

        if (response.status === 400 && detail.toLowerCase().includes('already applied')) {
          await fetchAppliedJobs()
          alert('You have already applied to this job.')
          return
        }

        alert(`Could not apply: ${detail}`)
        return
      }

      await fetchAppliedJobs()
      alert('Application submitted successfully!')
    } catch (err) {
      console.error('Network apply error:', err)
      alert('Network error trying to apply.')
    } finally {
      setApplying(false)
    }
  }

  const filteredJobs = jobs.filter(j =>
    (j.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.company || '').toLowerCase().includes(search.toLowerCase())
  )



  // Map API fields back to simple frontend JobOffer schema structure for compatibility
  const getCompatibleJob = (item: any) => {
    const rawType = (item.work_type || 'hybrid').toLowerCase()
    const validTypes = ['full-time', 'part-time', 'contract', 'remote', 'hybrid']
    const type = validTypes.includes(rawType) ? rawType : 'hybrid'

    return {
      id: item.job_offer_id,
      title: item.title,
      company: item.company || "Company",
      description: item.description || "No description provided.",
      requirements: item.requirements || [],
      skills: item.skills || [],
      location: item.location || "Not specified",
      type: type,
      salary: item.salary_min !== null && item.salary_max !== null ? {
        min: item.salary_min || 0,
        max: item.salary_max || 0,
        currency: item.currency || "EUR"
      } : undefined,
      experience: "1-3 years",
      applicants: 4,
      postedAt: item.created_at || new Date().toISOString(),
      status: 'active' as const,
      recruiterId: ''
    }
  }

  return (
    <div className="max-w-7xl space-y-6 p-4 bg-white min-h-screen text-slate-900">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Job Matches</h1>
        <p className="text-slate-900/40 text-sm mt-1">AI-powered semantic matching for your profile</p>
      </motion.div>

      {/* Warning if no CV has been uploaded yet */}
      {noCv && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">No CV found for your profile</p>
              <p className="text-xs text-slate-500">Please upload your CV PDF first so our engines can parse your skills and match you to jobs.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/candidate/cv')}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-slate-900 rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Upload CV Now
          </button>
        </div>
      )}

      {/* Search Bar area */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, companies…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500/50 transition-colors shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
          <SlidersHorizontal size={14} /> Filter
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Finding job matches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job cards stack list */}
          <div className="lg:col-span-2 space-y-3">
            {filteredJobs.map(item => {
              const compatibleJob = getCompatibleJob(item)

              return (
                <JobCard
                  key={item.job_offer_id}
                  job={compatibleJob as any}
                  mode="candidate"
                  onView={() => setSelected(item)}
                  onApply={() => handleApplyJob(item)}
                />
              )
            })}
            {filteredJobs.length === 0 && !noCv && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-400 text-sm font-medium">
                No active jobs found matching "{search}"
              </div>
            )}
          </div>

          {/* Right Detail side container panel */}
          <div className="space-y-4">
            {selected ? (
              <motion.div
                key={selected.job_offer_id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4 sticky top-4"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">{selected.title}</h3>
                    <p className="text-sm font-semibold text-violet-500 mt-0.5">{selected.company || "Company"}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {selected.description || "No description provided."}
                  </p>
                  {selected.requirements && selected.requirements.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requirements</p>
                      <ul className="space-y-1">
                        {selected.requirements.slice(0, 5).map((r: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-600 flex gap-2 items-start">
                            <span className="text-violet-500 font-bold">→</span>
                            <span className="line-clamp-2">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => handleApplyJob(selected)}
                    disabled={applying || appliedList.includes(resolveJobOfferId(selected))}
                    className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-900 text-sm font-bold transition-all shadow-sm"
                  >
                    {appliedList.includes(resolveJobOfferId(selected))
                      ? '✓ Applied'
                      : applying
                        ? 'Submitting...'
                        : 'Apply Now'}
                  </button>

                  <button
                    onClick={() => {
                      const jobOfferId = resolveJobOfferId(selected)
                      navigate(`/candidate/chat?jobId=${jobOfferId}&autoPrompt=true`)
                    }}
                    className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-700 bg-violet-50 hover:bg-violet-100 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Optimize CV with AI
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm font-medium">
                Select a job to view details
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}