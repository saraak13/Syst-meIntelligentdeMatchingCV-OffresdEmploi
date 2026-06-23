import { motion } from 'framer-motion'
import { MapPin, Clock, Users, DollarSign, Zap } from 'lucide-react'
import type { JobOffer } from '../../types'
import { SkillBadge } from './SkillBadge'
import { cn } from '../../lib/utils'

const typeColors: Record<JobOffer['type'], string> = {
  'full-time': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'part-time': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contract: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  remote: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  hybrid: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

interface JobCardProps {
  job: JobOffer
  matchScore?: number
  onApply?: (job: JobOffer) => void
  onView?: (job: JobOffer) => void
  onEdit?: (job: JobOffer) => void
  onDelete?: (job: JobOffer) => void
  mode?: 'candidate' | 'recruiter'
}

export function JobCard({ job, matchScore, onApply, onView, onEdit, onDelete, mode = 'candidate' }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-slate-200 bg-slate-50 backdrop-blur-sm p-5 space-y-4 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer"
      onClick={() => onView?.(job)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-base">{job.title}</h3>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border font-medium',
                typeColors[job.type]
              )}
            >
              {job.type}
            </span>
          </div>
          <p className="text-sm text-violet-400 font-medium mt-0.5">{job.company}</p>
        </div>
        {matchScore !== undefined && (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'text-lg font-bold',
                matchScore >= 85 ? 'text-emerald-400' : matchScore >= 70 ? 'text-violet-400' : 'text-amber-400'
              )}
            >
              {matchScore}%
            </div>
            <div className="text-[10px] text-slate-900/40">AI Match</div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-900/50">
        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        {job.salary && (
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            {(job.salary.min / 1000).toFixed(0)}k–{(job.salary.max / 1000).toFixed(0)}k {job.salary.currency}
          </span>
        )}
        <span className="flex items-center gap-1"><Clock size={11} />{job.experience}</span>
        <span className="flex items-center gap-1"><Users size={11} />{job.applicants} applicants</span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-900/60 leading-relaxed line-clamp-2">{job.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 5).map(skill => (
          <SkillBadge key={skill} skill={skill} size="sm" />
        ))}
        {job.skills.length > 5 && (
          <span className="text-xs text-slate-900/40 self-center">+{job.skills.length - 5}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-xs text-slate-900/30">
          Posted {new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {mode === 'recruiter' && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(job)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all font-medium"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(job)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all font-medium"
                >
                  Delete
                </button>
              )}
            </>
          )}
          {mode === 'candidate' && onApply && (
            <button
              onClick={() => onApply(job)}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-slate-900 transition-all font-medium"
            >
              <Zap size={12} /> Apply Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
