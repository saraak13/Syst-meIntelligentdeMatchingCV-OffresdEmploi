import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, ClipboardList, TrendingUp, Zap, Star, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { SkillBadge } from '../../components/shared/SkillBadge'
import { JobCard } from '../../components/shared/JobCard'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

export function CandidateDashboard() {
  const { user } = useAuth()
  const [topMatches, setTopMatches] = useState<any[]>([])
  const [cvSkills, setCvSkills] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [profileStrength, setProfileStrength] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState('N/A')

  const getWeeklyApplicationsData = (userApps: any[]) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayName = days[d.getDay()]

      const count = userApps.filter(app => {
        const appDate = new Date(app.appliedAt)
        return appDate.getFullYear() === d.getFullYear() &&
               appDate.getMonth() === d.getMonth() &&
               appDate.getDate() === d.getDate()
      }).length

      result.push({
        day: dayName,
        applications: count
      })
    }

    return result
  }

  const activityData = getWeeklyApplicationsData(apps)

  useEffect(() => {
    if (!user) return

    const fetchApplications = async () => {
      try {
        const response = await fetch(`/api/applications/candidate/${user.id}`)
        if (response.ok) {
          const pgApps = await response.json()
          setApps(pgApps)

          // Compute average response time in days
          const nonPendingApps = pgApps.filter((a: any) => a.status !== 'pending' && a.status !== 'sought')
          if (nonPendingApps.length > 0) {
            let totalDays = 0
            let validCounts = 0
            nonPendingApps.forEach((a: any) => {
              if (a.appliedAt && a.updatedAt) {
                const diffTime = Math.abs(new Date(a.updatedAt).getTime() - new Date(a.appliedAt).getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                totalDays += diffDays
                validCounts++
              }
            })
            if (validCounts > 0) {
              const avg = Math.round(totalDays / validCounts)
              setAvgResponseTime(`${avg} ${avg > 1 ? 'Days' : 'Day'}`)
            } else {
              setAvgResponseTime('N/A')
            }
          } else {
            setAvgResponseTime('N/A')
          }
        }
      } catch (err) {
        console.error('Error fetching applications for dashboard:', err)
      }
    }

    // 1. Fetch CV Skills from DB
    const fetchCv = async () => {
      try {
        const res = await fetch(`/api/cvs/user/${user.id}`)
        if (res.ok) {
          const cvData = await res.json()
          if (cvData && cvData.parsed_json) {
            const rawSkills = cvData.parsed_json.technical_skills || cvData.parsed_json.skills || []
            const mappedSkills: any[] = []

            if (Array.isArray(rawSkills)) {
              rawSkills.forEach((s: any) => {
                if (typeof s === 'string') {
                  mappedSkills.push({ name: s, level: 'advanced', category: 'Skill' })
                } else if (s && typeof s === 'object') {
                  mappedSkills.push({
                    name: s.name || s.skill || "Skill",
                    level: s.level || 'advanced',
                    category: s.category || 'Skill'
                  })
                }
              })
            } else if (rawSkills && typeof rawSkills === 'object') {
              Object.entries(rawSkills).forEach(([category, list]: any) => {
                if (Array.isArray(list)) {
                  list.forEach(skillName => {
                    mappedSkills.push({ name: skillName, level: 'advanced', category })
                  })
                } else if (typeof list === 'string') {
                  mappedSkills.push({ name: list, level: 'advanced', category })
                }
              })
            }
            setCvSkills(mappedSkills)

            // Let's calculate CV Profile Strength
            let score = 10 // baseline
            const parsed = cvData.parsed_json
            if (parsed.full_name || cvData.candidate_name) score += 15
            if (parsed.title || parsed.bio || parsed.summary) score += 15
            if (parsed.summary) score += 15
            if (parsed.education && parsed.education.length > 0) score += 15
            if (parsed.work_experience && parsed.work_experience.length > 0) score += 15
            if (mappedSkills.length > 0) score += 15
            setProfileStrength(Math.min(score, 100))
          }
        }
      } catch (err) {
        console.error("Error fetching CV skills for dashboard:", err)
      }
    }

    // 3. Fetch Top matches from PostgreSQL semantic engine
    const fetchTopMatches = async () => {
      try {
        const res = await fetch(`/api/matching/top-jobs/${user.id}`)
        if (res.ok) {
          const matchesData = await res.json()
          setTopMatches(matchesData.slice(0, 2))
        }
      } catch (err) {
        console.error("Error fetching top matches in dashboard:", err)
      }
    }

    fetchApplications()
    fetchCv()
    fetchTopMatches()
  }, [user])

  const stats = [
    { label: 'Applications', value: apps.length, icon: ClipboardList, color: 'text-blue-400' },
    { label: 'Interviews & Shortlists', value: apps.filter(a => ['shortlisted', 'interview', 'offered'].includes(a.status)).length, icon: Star, color: 'text-amber-400' },
    { label: 'CV Profile Strength', value: profileStrength > 0 ? `${profileStrength}%` : 'Upload CV', icon: Zap, color: 'text-violet-400' },
    { label: 'Avg Response Time', value: avgResponseTime, icon: TrendingUp, color: 'text-emerald-400' },
  ]

  // Doughnut status breakdown data
  const statusCounts = {
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0,
  }
  apps.forEach(app => {
    const status = app.status?.toLowerCase()
    if (status in statusCounts) {
      statusCounts[status as keyof typeof statusCounts]++
    } else {
      statusCounts.pending++
    }
  })
  
  const funnelData = [
    { name: 'Pending Review', value: statusCounts.pending, color: '#8b5cf6' },
    { name: 'Under AI Review', value: statusCounts.reviewed, color: '#6366f1' },
    { name: 'Shortlisted', value: statusCounts.shortlisted, color: '#3b82f6' },
    { name: 'Interview', value: statusCounts.interview, color: '#10b981' },
    { name: 'Offered', value: statusCounts.offered, color: '#059669' },
    { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const hasApps = apps.length > 0
  const finalFunnelData = hasApps ? funnelData : [{ name: 'No Applications Yet', value: 1, color: '#cbd5e1' }]



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
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">
          Good afternoon, <span className="gradient-text">{user?.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-900/40 text-sm mt-1">Here's your recruitment activity overview</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-900/40">{s.label}</span>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-900">Weekly Applications</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="appsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#ffffff20" tick={{ fill: '#00000040', fontSize: 11 }} />
              <YAxis stroke="#ffffff20" tick={{ fill: '#00000040', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} fill="url(#appsGrad)" name="Applications Submitted" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-900">Your Skills (from CV)</h2>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {cvSkills.map(skill => (
              <SkillBadge key={skill.name} skill={skill} showLevel />
            ))}
            {cvSkills.length === 0 && (
              <div className="text-slate-900/30 text-xs py-4 text-center w-full">
                No parsed skills yet.<br />Please upload your CV PDF to load skills.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Application Funnel Chart Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Pipeline Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3"
        >
          <h2 className="text-sm font-semibold text-slate-900">Application Pipeline Status</h2>
          <div className="h-[240px] flex items-center justify-center bg-white/50 rounded-xl p-2 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalFunnelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {finalFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e1b4b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 11
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] text-slate-500 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top matches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Top Job Matches</h2>
            <Link to="/candidate/jobs" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {topMatches.map(match => {
            const compatibleJob = getCompatibleJob(match)
            return (
              <JobCard 
                key={match.job_offer_id} 
                job={compatibleJob as any} 
                mode="candidate" 
              />
            )
          })}
          {topMatches.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-900/30 text-xs">
              No semantic matches calculated yet. Please upload your CV first.
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Applications</h2>
            <Link to="/candidate/applications" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {apps.slice(0, 3).map(app => {
            const title = app.jobTitle || 'Job Application'
            const company = app.jobCompany || 'Company'
            const statusColors: Record<string, string> = {
              pending: 'bg-amber-500/20 text-amber-400',
              reviewed: 'bg-blue-500/20 text-blue-400',
              shortlisted: 'bg-violet-500/20 text-violet-400',
              interview: 'bg-emerald-500/20 text-emerald-400',
              offered: 'bg-emerald-500/30 text-emerald-300',
              rejected: 'bg-red-500/20 text-red-400',
            }
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
                  <p className="text-xs text-slate-900/40">{company}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[app.status] || statusColors['pending']}`}>
                  {app.status}
                </span>
              </motion.div>
            )
          })}
          {apps.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-900/30 text-xs">
              No recent applications. Go to Job Matches to apply!
            </div>
          )}
        </div>
      </div>


    </div>
  )
  
}

