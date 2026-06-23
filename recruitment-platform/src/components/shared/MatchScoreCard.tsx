import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface MatchScoreCardProps {
  overall: number
  skillSimilarity: number
  experienceSimilarity: number
  educationSimilarity: number
  projectSimilarity: number
  size?: 'sm' | 'md' | 'lg'
}

function ScoreRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 56, md: 80, lg: 120 }
  const r = sizes[size] / 2 - 6
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const dim = sizes[size]

  const color =
    score >= 85 ? '#10b981' : score >= 70 ? '#8b5cf6' : score >= 55 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="rotate-[-90deg]">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-slate-900/10"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn('font-bold leading-none', {
            'text-xs': size === 'sm',
            'text-lg': size === 'md',
            'text-3xl': size === 'lg',
          })}
          style={{ color }}
        >
          {score}
        </span>
        {size !== 'sm' && <span className="text-[10px] text-slate-900/40 mt-0.5">/ 100</span>}
      </div>
    </div>
  )
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-violet-500' : value >= 55 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-900/60">{label}</span>
        <span className="text-slate-900/80 font-medium">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  )
}

export function MatchScoreCard({
  overall,
  skillSimilarity,
  experienceSimilarity,
  educationSimilarity,
  projectSimilarity,
  size = 'md',
}: MatchScoreCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center gap-4">
        <ScoreRing score={overall} size={size === 'lg' ? 'md' : 'sm'} />
        <div>
          <p className="text-xs text-slate-900/50 uppercase tracking-wider">AI Match Score</p>
          <p
            className={cn('font-bold', {
              'text-emerald-400': overall >= 85,
              'text-violet-400': overall >= 70 && overall < 85,
              'text-amber-400': overall >= 55 && overall < 70,
              'text-red-400': overall < 55,
            })}
          >
            {overall >= 85
              ? '🟢 Excellent Match'
              : overall >= 70
              ? '🟣 Good Match'
              : overall >= 55
              ? '🟡 Partial Match'
              : '🔴 Poor Match'}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <MiniBar label="Skills" value={skillSimilarity} />
        <MiniBar label="Experience" value={experienceSimilarity} />
        <MiniBar label="Education" value={educationSimilarity} />
        <MiniBar label="Projects" value={projectSimilarity} />
      </div>
    </div>
  )
}

export { ScoreRing }
