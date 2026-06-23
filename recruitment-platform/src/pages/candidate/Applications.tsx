import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Clock, CheckCircle, XCircle, Star, Eye } from 'lucide-react'
import type { ApplicationStatus } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock size={13} /> },
  reviewed: { label: 'Under Review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Eye size={13} /> },
  shortlisted: { label: 'Shortlisted', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: <Star size={13} /> },
  interview: { label: 'Interview', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle size={13} /> },
  offered: { label: 'Offer Received', color: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40', icon: <CheckCircle size={13} /> },
  rejected: { label: 'Not Selected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle size={13} /> },
}

const steps: ApplicationStatus[] = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered']

export function ApplicationsPage() {
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/applications/candidate/${user.id}`)
      if (response.ok) {
        const pgApps = await response.json()
        setApps(pgApps)
      }
    } catch (err) {
      console.error('Error fetching live applications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [user])



  return (
    <div className="max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-900/40 text-sm mt-1">Track and manage the status of all your job applications</p>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-900/30">
          <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
          <p>No applications yet. Start applying to jobs!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app, i) => {
            const title = app.jobTitle || 'Job Application'
            const company = app.jobCompany || 'Company'
            const config = statusConfig[app.status as ApplicationStatus] || statusConfig['pending']
            const stepIdx = steps.indexOf(app.status as ApplicationStatus)

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{title}</p>
                      <p className="text-sm text-violet-400">{company}</p>
                      <p className="text-xs text-slate-900/30 mt-0.5">
                        Applied {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Status Display */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Progress pipeline */}
                {app.status !== 'rejected' && (
                  <div className="flex items-center gap-1">
                    {steps.map((step, idx) => (
                      <div key={step} className="flex items-center gap-1 flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                            idx <= stepIdx
                              ? 'bg-violet-500 border-violet-500'
                              : 'bg-transparent border-slate-300'
                          }`} />
                          <span className="text-[9px] text-slate-900/30 mt-1 text-center capitalize hidden sm:block">{step}</span>
                        </div>
                        {idx < steps.length - 1 && (
                          <div className={`h-px flex-1 -mt-4 transition-colors ${idx < stepIdx ? 'bg-violet-500/50' : 'bg-slate-100'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recruiter Notes Message Block */}
                {app.recruiterNotes && (
                  <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-1 mt-3">
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Message from Recruiter</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{app.recruiterNotes}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
