import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Briefcase, Mail, Code, Link, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { CandidateProfile } from '../../types'
import { SkillBadge } from './SkillBadge'
import { ScoreRing } from './MatchScoreCard'

interface CandidateCardProps {
  candidate: CandidateProfile
  score?: number
  onEmailGenerate?: (candidate: CandidateProfile) => void
  onViewProfile?: (candidate: CandidateProfile) => void
  compact?: boolean
}

export function CandidateCard({
  candidate,
  score,
  onEmailGenerate,
  onViewProfile,
  compact = false,
}: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-slate-200 bg-slate-50 backdrop-blur-sm p-5 space-y-4 transition-shadow hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={candidate.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
              alt={candidate.name}
              className="w-12 h-12 rounded-full ring-2 ring-violet-500/30 bg-slate-100"
            />
            {score !== undefined && score >= 85 && (
              <span className="absolute -top-1 -right-1 text-sm">🏆</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{candidate.name}</h3>
            <p className="text-sm text-slate-900/60">{candidate.title}</p>
            <div className="flex items-center gap-1 text-xs text-slate-900/40 mt-0.5">
              <MapPin size={11} />
              {candidate.location}
            </div>
          </div>
        </div>
        {score !== undefined && <ScoreRing score={score} size="sm" />}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5">
        {candidate.skills.slice(0, compact ? 4 : 6).map(skill => (
          <SkillBadge key={skill.name} skill={skill} size="sm" />
        ))}
        {candidate.skills.length > 6 && (
          <span className="text-xs text-slate-900/40 self-center">+{candidate.skills.length - 6} more</span>
        )}
      </div>

      {/* Expanded info */}
      {!compact && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3 pt-2 border-t border-slate-200"
        >
          <p className="text-sm text-slate-900/60 leading-relaxed">{candidate.summary}</p>
          {candidate.experiences[0] && (
            <div className="flex gap-2 text-sm">
              <Briefcase size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-900/80">{candidate.experiences[0].title}</span>
                <span className="text-slate-900/40"> at {candidate.experiences[0].company}</span>
              </div>
            </div>
          )}
          <div className="flex gap-2 text-xs text-slate-900/40">
            <span>{candidate.languages.join(' · ')}</span>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          {candidate.github && (
            <a href="#" className="text-slate-900/40 hover:text-slate-900/80 transition-colors">
              <Code size={15} />
            </a>
          )}
          {candidate.linkedIn && (
            <a href="#" className="text-slate-900/40 hover:text-slate-900/80 transition-colors">
              <Link size={15} />
            </a>
          )}
          <a href="#" className="text-slate-900/40 hover:text-slate-900/80 transition-colors">
            <Mail size={15} />
          </a>
        </div>
        <div className="flex gap-2">
          {!compact && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-slate-900/40 hover:text-slate-900/70 transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Less' : 'More'}
            </button>
          )}
          {onEmailGenerate && (
            <button
              onClick={() => onEmailGenerate(candidate)}
              className="text-xs bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg px-3 py-1.5 transition-all font-medium"
            >
              ✉ Generate Email
            </button>
          )}
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(candidate)}
              className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 transition-all font-medium"
            >
              <ExternalLink size={12} />
              Profile
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
