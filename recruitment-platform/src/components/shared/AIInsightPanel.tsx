import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import type { MatchScore } from '../../types'

interface AIInsightPanelProps {
  score?: MatchScore
  isLoading?: boolean
}

export function AIInsightPanel({ score, isLoading }: AIInsightPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-500/50 animate-pulse" />
          <div className="h-4 w-32 skeleton rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 skeleton rounded" style={{ width: `${80 - i * 10}%` }} />
        ))}
      </div>
    )
  }

  if (!score) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-violet-500/20 rounded-lg">
          <Sparkles size={14} className="text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-violet-300">AI Analysis</span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-900/70 leading-relaxed">{score.explanation || "AI is computing your compatibility report..."}</p>

      {/* Strengths */}
      {score.strengths && score.strengths.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <TrendingUp size={12} />
            Strengths
          </div>
          <ul className="space-y-1">
            {score.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 text-xs text-slate-900/60"
              >
                <span className="text-emerald-400 mt-0.5">✓</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {score.gaps && score.gaps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
            <AlertCircle size={12} />
            Skill Gaps
          </div>
          <ul className="space-y-1">
            {score.gaps.map((g, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-2 text-xs text-slate-900/60"
              >
                <span className="text-amber-400 mt-0.5">△</span>
                {g}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
