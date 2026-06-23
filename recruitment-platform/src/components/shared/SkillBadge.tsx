import { cn } from '../../lib/utils'
import type { Skill } from '../../types'

const levelColors: Record<Skill['level'], string> = {
  beginner: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  advanced: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  expert: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const levelDots: Record<Skill['level'], number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
}

interface SkillBadgeProps {
  skill: Skill | string
  showLevel?: boolean
  size?: 'sm' | 'md'
}

export function SkillBadge({ skill, showLevel = false, size = 'md' }: SkillBadgeProps) {
  const isString = typeof skill === 'string'
  const name = isString ? skill : skill.name
  const level = isString ? null : skill.level

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all hover:scale-105',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        level ? levelColors[level] : 'bg-violet-500/20 text-violet-400 border-violet-500/30'
      )}
    >
      {showLevel && level && (
        <span className="flex gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 w-1 rounded-full',
                i < levelDots[level] ? 'bg-current' : 'bg-current/20'
              )}
            />
          ))}
        </span>
      )}
      {name}
    </span>
  )
}
