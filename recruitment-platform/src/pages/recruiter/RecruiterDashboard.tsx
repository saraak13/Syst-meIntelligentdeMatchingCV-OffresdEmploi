import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { TrendingUp, Users, Briefcase,
  Layers, Loader2, Info,
  RefreshCw, Zap,
  TrendingDown, CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, 
} from 'recharts'

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Applicant {
  id: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  jobId: string
  jobTitle: string
  cvId: string | null
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'offered' | 'rejected'
  appliedAt: string
}

interface JobOffer {
  id: string
  title: string
  status: string
  is_active: boolean
}

interface CandidateMatch {
  user_id: string
  final_score: number
}

interface JobPerformance {
  jobId: string
  title: string
  applicationsCount: number
  avgScore: number
  rank: number
}

// ─── Sub-Components ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1A2456', border: '1px solid #2D3A6B', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <p style={{ fontWeight: 700, marginBottom: 4, color: '#A5B4FC' }}>{label || payload[0]?.payload?.name}</p>
        <p style={{ color: '#E2E8F0', margin: 0 }}>Count: <span style={{ fontWeight: 700, color: '#6EE7B7' }}>{payload[0].value}</span></p>
      </div>
    )
  }
  return null
}

function HealthRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Needs Attention'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#1A2456" strokeWidth={12} />
        <circle cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${fill} ${circ}`} strokeDashoffset={circ / 4} style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        <text x={64} y={60} textAnchor="middle" fill="#E2E8F0" fontSize={22} fontWeight={800} fontFamily="monospace">{score}</text>
        <text x={64} y={78} textAnchor="middle" fill="#6B7DB8" fontSize={9} fontFamily="Inter, sans-serif" letterSpacing={1}>PIPELINE</text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1 }}>{label.toUpperCase()}</span>
    </div>
  )
}

function FunnelStep({ stage, value, prevValue, color, isLast }: { stage: string; value: number; prevValue: number | null; color: string; isLast: boolean }) {
  const dropPct = prevValue && prevValue > 0 ? Math.round(((prevValue - value) / prevValue) * 100) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', background: '#0B1437', border: `1px solid ${color}44`, borderRadius: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1', flex: 1 }}>{stage}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#E2E8F0', fontFamily: 'monospace' }}>{value}</span>
      </div>
      {!isLast && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0' }}>
          <div style={{ width: 1, height: 10, background: '#2D3A6B' }} />
          {dropPct !== null && dropPct > 0 && (
            <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingDown size={10} /> −{dropPct}%
            </span>
          )}
          <div style={{ width: 1, height: 10, background: '#2D3A6B' }} />
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function RecruiterDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedJobId, setSelectedJobId] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [jobOptions, setJobOptions] = useState<JobOffer[]>([])

  const [stats, setStats] = useState({ totalCandidates: 0, totalApplications: 0, activeJobs: 0, avgMatchScore: 0 })
  const [funnelData, setFunnelData] = useState<{ name: string; value: number; color: string }[]>([])
  const [distributionData, setDistributionData] = useState<{ name: string; count: number; color: string }[]>([])
  const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([])
  const [insights, setInsights] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning'; icon: string }[]>([])
  const [pipelineHealth, setPipelineHealth] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)

  const loadDashboardData = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const jobsRes = await fetch(`/api/jobs/recruiter/${user.id}`)
      if (!jobsRes.ok) throw new Error('Failed to fetch job offers')
      const allJobs: JobOffer[] = await jobsRes.json()
      setJobOptions(allJobs)

      const appsRes = await fetch(`/api/applications/recruiter/${user.id}`)
      if (!appsRes.ok) throw new Error('Failed to fetch applications')
      let allApps: Applicant[] = await appsRes.json()

      if (dateRange !== 'all') {
        const cutoff = new Date()
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        cutoff.setDate(cutoff.getDate() - days)
        allApps = allApps.filter(a => new Date(a.appliedAt) >= cutoff)
      }

      const filteredJobs = selectedJobId === 'all' ? allJobs : allJobs.filter(j => j.id === selectedJobId)
      const filteredApps = selectedJobId === 'all' ? allApps : allApps.filter(a => a.jobId === selectedJobId)

      const matchScoresMap: { [jobId: string]: { [candidateId: string]: number } } = {}
      await Promise.all(
        filteredJobs.map(async (job) => {
          try {
            const matchesRes = await fetch(`/api/matching/top-candidates/${job.id}?limit=100`)
            if (matchesRes.ok) {
              const matchesData: CandidateMatch[] = await matchesRes.json()
              const candidateMap: { [candidateId: string]: number } = {}
              matchesData.forEach(m => { candidateMap[m.user_id] = m.final_score * 100 })
              matchScoresMap[job.id] = candidateMap
            }
          } catch { /* silent fallback */ }
        })
      )

      let totalScoreSum = 0
      let scoredAppsCount = 0
      const allMappedScores: number[] = []
      const jobAppsCountMap: { [jobId: string]: number } = {}
      const jobScoresSumMap: { [jobId: string]: number } = {}
      const jobScoredAppsCountMap: { [jobId: string]: number } = {}

      filteredJobs.forEach(job => {
        jobAppsCountMap[job.id] = 0
        jobScoresSumMap[job.id] = 0
        jobScoredAppsCountMap[job.id] = 0
      })

      filteredApps.forEach(app => {
        jobAppsCountMap[app.jobId] = (jobAppsCountMap[app.jobId] || 0) + 1
        const jobMap = matchScoresMap[app.jobId]
        let score = 0
        if (jobMap && jobMap[app.candidateId] !== undefined) {
          score = jobMap[app.candidateId]
        } else {
          const charSum = app.candidateId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + app.jobId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
          score = null
        }
        allMappedScores.push(score)
        totalScoreSum += score
        scoredAppsCount++
        jobScoresSumMap[app.jobId] = (jobScoresSumMap[app.jobId] || 0) + score
        jobScoredAppsCountMap[app.jobId] = (jobScoredAppsCountMap[app.jobId] || 0) + 1
      })

      const avgMatchScore = scoredAppsCount > 0 ? Math.round(totalScoreSum / scoredAppsCount) : 0

      const funnelStages = { Applied: 0, 'Under AI Review': 0, Shortlisted: 0, Interview: 0, Offered: 0 }
      filteredApps.forEach(app => {
        if (app.status === 'pending') funnelStages.Applied++
        else if (app.status === 'reviewed') funnelStages['Under AI Review']++
        else if (app.status === 'shortlisted') funnelStages.Shortlisted++
        else if (app.status === 'interview') funnelStages.Interview++
        else if (app.status === 'offered') funnelStages.Offered++
      })

      const mappedFunnel = [
        { name: 'Applied', value: funnelStages.Applied, color: '#818CF8' },
        { name: 'Under AI Review', value: funnelStages['Under AI Review'], color: '#6366F1' },
        { name: 'Shortlisted', value: funnelStages.Shortlisted, color: '#3B82F6' },
        { name: 'Interview', value: funnelStages.Interview, color: '#EC4899' },
        { name: 'Offered', value: funnelStages.Offered, color: '#10B981' }
      ]

      const convRate = funnelStages.Applied > 0 ? Math.round((funnelStages.Offered / funnelStages.Applied) * 100) : 0
      setConversionRate(convRate)

      const reviewedPct = filteredApps.length > 0 ? ((funnelStages['Under AI Review'] + funnelStages.Shortlisted + funnelStages.Interview + funnelStages.Offered) / filteredApps.length) * 100 : 0
      const healthScore = Math.round((reviewedPct * 0.4) + (avgMatchScore * 0.6))
      setPipelineHealth(Math.min(healthScore, 100))

      const distributionBuckets = { '0–20': 0, '21–40': 0, '41–60': 0, '61–80': 0, '81–100': 0 }
      allMappedScores.forEach(s => {
        if (s <= 20) distributionBuckets['0–20']++
        else if (s <= 40) distributionBuckets['21–40']++
        else if (s <= 60) distributionBuckets['41–60']++
        else if (s <= 80) distributionBuckets['61–80']++
        else distributionBuckets['81–100']++
      })

      const mappedDistribution = [
        { name: '0–20', count: distributionBuckets['0–20'], color: '#EF4444' },
        { name: '21–40', count: distributionBuckets['21–40'], color: '#F97316' },
        { name: '41–60', count: distributionBuckets['41–60'], color: '#EAB308' },
        { name: '61–80', count: distributionBuckets['61–80'], color: '#3B82F6' },
        { name: '81–100', count: distributionBuckets['81–100'], color: '#10B981' }
      ]

      let formattedPerf: JobPerformance[] = filteredJobs.map(job => ({
        jobId: job.id,
        title: job.title,
        applicationsCount: jobAppsCountMap[job.id] || 0,
        avgScore: jobScoredAppsCountMap[job.id] > 0 ? Math.round(jobScoresSumMap[job.id] / jobScoredAppsCountMap[job.id]) : 0,
        rank: 0
      }))
      formattedPerf = formattedPerf.sort((a, b) => b.avgScore - a.avgScore || b.applicationsCount - a.applicationsCount)
      formattedPerf.forEach((item, i) => { item.rank = i + 1 })

      const computedInsights: any[] = []
      if (formattedPerf.length > 0) {
        const topJob = formattedPerf[0]
        if (topJob.avgScore > 75 && topJob.applicationsCount > 0) {
          computedInsights.push({ title: 'Top Compatibility Pool', desc: `"${topJob.title}" leads with an avg match score of ${topJob.avgScore}%. Prioritize slots here.`, type: 'success', icon: '🎯' })
        }
      }

      const uniqueCandidates = new Set(filteredApps.map(a => a.candidateId)).size
      const activeJobsCount = allJobs.filter(j => j.status === 'active' || j.is_active !== false).length

      setStats({ totalCandidates: uniqueCandidates, totalApplications: filteredApps.length, activeJobs: activeJobsCount, avgMatchScore })
      setFunnelData(mappedFunnel)
      setDistributionData(mappedDistribution)
      setJobPerformance(formattedPerf)
      setInsights(computedInsights.length ? computedInsights : [{ title: 'Dashboard Ready', desc: 'Active pipeline tracking live.', type: 'info', icon: '💡' }])

    } catch (err: any) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, selectedJobId, dateRange])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props
    return <text x={x + width + 6} y={y + 11} fill="#64748B" fontSize={11} fontFamily="monospace" fontWeight={700}>{value}%</text>
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px] gap-4"><Loader2 className="animate-spin text-violet-500" size={32} /><p className="text-sm text-slate-400">Loading performance data...</p></div>
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header Dropdowns */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruiter Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time pipeline analytics & active matching statistics</p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none">
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none max-w-[160px]">
            <option value="all">All positions</option>
            {jobOptions.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>

          <button onClick={() => { setRefreshing(true); loadDashboardData(); }} disabled={refreshing} className="p-2 bg-violet-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Candidate Pool', value: stats.totalCandidates, sub: 'unique profiles', icon: Users, accent: '#3B82F6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.1)' },
          { label: 'Applications', value: stats.totalApplications, sub: 'total volume', icon: Layers, accent: '#8B5CF6', bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.1)' },
          { label: 'Active Jobs', value: stats.activeJobs, sub: 'live openings', icon: Briefcase, accent: '#6366F1', bg: 'rgba(99,102,241,0.05)', border: 'rgba(99,102,241,0.1)' },
          { label: 'Avg Match Score', value: `${stats.avgMatchScore}%`, sub: 'semantic average', icon: TrendingUp, accent: '#10B981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.1)' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'applied → hired', icon: CheckCircle2, accent: '#F59E0B', bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.1)' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 font-mono tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
            <div style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 12, padding: 10 }}>
              <stat.icon size={18} color={stat.accent} />
            </div>
          </div>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Hiring Funnel</h3>
            <p className="text-slate-400 text-[11px]">Process distribution metrics and milestones</p>
          </div>
          <div className="flex gap-6 items-start flex-col sm:flex-row">
            <div className="flex-1 w-full space-y-1">
              {funnelData.map((stage, i) => (
                <FunnelStep key={stage.name} stage={stage.name} value={stage.value} prevValue={i > 0 ? funnelData[i-1].value : null} color={stage.color} isLast={i === funnelData.length - 1} />
              ))}
            </div>
            <div className="flex flex-col items-center mx-auto">
              <HealthRing score={pipelineHealth} />
            </div>
          </div>
        </div>

        {/* Histogram Distribution */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Match Score Distribution</h3>
            <p className="text-slate-400 text-[11px]">Histogram of automatic profiles ranking density</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#CBD5E1" fontSize={10} />
                <YAxis stroke="#CBD5E1" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {distributionData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Rankings & Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Performance */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Position Performance Ranking</h3>
            <p className="text-slate-400 text-[11px]">Active parameters performance benchmarks</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-2">#</th>
                  <th className="p-2">Position</th>
                  <th className="p-2 text-center">Applications</th>
                  <th className="p-2 text-center">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {jobPerformance.map(job => (
                  <tr key={job.jobId} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-2 font-bold">{job.rank === 1 ? '🥇' : job.rank === 2 ? '🥈' : job.rank === 3 ? '🥉' : job.rank}</td>
                    <td className="p-2 font-semibold text-slate-700">{job.title}</td>
                    <td className="p-2 text-center text-slate-500 font-medium">{job.applicationsCount}</td>
                    <td className="p-2 text-center">
                      <span style={{ background: job.avgScore >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: job.avgScore >= 80 ? '#10B981' : '#6366F1' }} className="px-2 py-0.5 rounded-full font-bold font-mono">
                        {job.avgScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dark Insights Side View Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between text-white">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5"><Zap size={14} className="text-violet-400" /> Key Insights</h3>
              <p className="text-slate-500 text-[11px]">System inferences from live funnel data arrays</p>
            </div>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {insights.map((insight, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)' }} className="border border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                    <span>{insight.icon}</span>
                    <span>{insight.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{insight.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex gap-1.5 items-start">
            <Info size={12} className="shrink-0 mt-0.5" />
            <p>Metrics parsed natively from active funnel metrics and dynamic database weights matrix indices loops.</p>
          </div>
        </div>
      </div>
    </div>
  )
}