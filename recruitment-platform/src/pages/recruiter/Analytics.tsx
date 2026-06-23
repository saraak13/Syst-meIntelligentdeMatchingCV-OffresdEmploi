import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import {
  BarChart3, TrendingUp, Users, Briefcase,
  Layers, Award, AlertCircle, Loader2, Info,
  RefreshCw, ChevronDown, Calendar, Zap,
  TrendingDown, CheckCircle2, 
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, ReferenceLine
} from 'recharts'
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
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
  first_name: string
  last_name: string
  email: string
  cv_id: string
  semantic_score: number
  keyword_bonus: number
  final_score: number
}
 
interface JobPerformance {
  jobId: string
  title: string
  applicationsCount: number
  avgScore: number
  rank: number
}
 
// ─── Custom Tooltip ────────────────────────────────────────────────────────────
 
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1A2456',
        border: '1px solid #2D3A6B',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        color: '#E2E8F0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4, color: '#A5B4FC' }}>
          {label || payload[0]?.payload?.name}
        </p>
        <p style={{ color: '#E2E8F0', margin: 0 }}>
          Count: <span style={{ fontWeight: 700, color: '#6EE7B7' }}>{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}
 
// ─── Pipeline Health Ring ──────────────────────────────────────────────────────
 
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
        <circle
          cx={64} cy={64} r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
        <text x={64} y={60} textAnchor="middle" fill="#E2E8F0" fontSize={22} fontWeight={800} fontFamily="monospace">
          {score}
        </text>
        <text x={64} y={78} textAnchor="middle" fill="#6B7DB8" fontSize={9} fontFamily="Inter, sans-serif" letterSpacing={1}>
          PIPELINE
        </text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1 }}>{label.toUpperCase()}</span>
    </div>
  )
}
 
// ─── Funnel Step ───────────────────────────────────────────────────────────────
 
function FunnelStep({
  stage, value, prevValue, color, isLast
}: { stage: string; value: number; prevValue: number | null; color: string; isLast: boolean }) {
  const dropPct = prevValue && prevValue > 0 ? Math.round(((prevValue - value) / prevValue) * 100) : null
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', background: '#0B1437', border: `1px solid ${color}44`, borderRadius: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}88`, flexShrink: 0 }} />
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
 
// ─── Main Component ────────────────────────────────────────────────────────────
 
export function Analytics() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  // Filter state
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
 
  const loadAnalyticsData = useCallback(async () => {
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
 
      // Apply date range filter
      if (dateRange !== 'all') {
        const cutoff = new Date()
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        cutoff.setDate(cutoff.getDate() - days)
        allApps = allApps.filter(a => new Date(a.appliedAt) >= cutoff)
      }
 
      // Apply job filter
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
          const charSum = app.candidateId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
            app.jobId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
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
 
      // Conversion rate: offered / applied
      const convRate = funnelStages.Applied > 0 ? Math.round((funnelStages.Offered / funnelStages.Applied) * 100) : 0
      setConversionRate(convRate)
 
      // Pipeline health score
      const reviewedPct = filteredApps.length > 0
        ? ((funnelStages['Under AI Review'] + funnelStages.Shortlisted + funnelStages.Interview + funnelStages.Offered) / filteredApps.length) * 100
        : 0
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
 
      // ── Insights ──
      const computedInsights: { title: string; desc: string; type: 'success' | 'info' | 'warning'; icon: string }[] = []
 
      if (formattedPerf.length > 0) {
        const topJob = formattedPerf[0]
        const mostActive = [...formattedPerf].sort((a, b) => b.applicationsCount - a.applicationsCount)[0]
 
        if (topJob.avgScore > 75 && topJob.applicationsCount > 0) {
          computedInsights.push({
            title: 'Top Compatibility Pool',
            desc: `"${topJob.title}" leads with an avg match score of ${topJob.avgScore}%. Prioritize interview slots here.`,
            type: 'success', icon: '🎯'
          })
        }
 
        if (mostActive && mostActive.applicationsCount > 0) {
          computedInsights.push({
            title: 'Most Active Position',
            desc: `"${mostActive.title}" received the most applications (${mostActive.applicationsCount}). Consider expanding its pipeline capacity.`,
            type: 'info', icon: '📊'
          })
        }
      }
 
      // Drop-off insight
      const stageValues = Object.values(funnelStages)
      let maxDrop = 0
      let maxDropStage = ''
      const stageNames = Object.keys(funnelStages)
      for (let i = 1; i < stageValues.length; i++) {
        const drop = stageValues[i - 1] > 0 ? ((stageValues[i - 1] - stageValues[i]) / stageValues[i - 1]) * 100 : 0
        if (drop > maxDrop) { maxDrop = drop; maxDropStage = stageNames[i] }
      }
      if (maxDrop > 30 && maxDropStage) {
        computedInsights.push({
          title: 'Funnel Drop-off Detected',
          desc: `The "${maxDropStage}" stage has the largest drop-off at ${Math.round(maxDrop)}%. Review criteria or communication at this step.`,
          type: 'warning', icon: '⚠️'
        })
      }
 
      if (convRate > 0) {
        computedInsights.push({
          title: 'Recruitment Conversion Rate',
          desc: `${convRate}% of applicants are reaching offer stage. ${convRate >= 5 ? 'Above industry baseline — strong funnel efficiency.' : 'Below typical 5% benchmark — consider expanding shortlist criteria.'}`,
          type: convRate >= 5 ? 'success' : 'warning', icon: convRate >= 5 ? '✅' : '📉'
        })
      }
 
      if (computedInsights.length === 0) {
        computedInsights.push({
          title: 'Dashboard Ready',
          desc: 'Post job descriptions and receive applications to populate matching analytics and pipeline insights.',
          type: 'info', icon: '💡'
        })
      }
 
      const uniqueCandidates = new Set(filteredApps.map(a => a.candidateId)).size
      const activeJobsCount = allJobs.filter(j => j.status === 'active' || j.is_active !== false).length
 
      setStats({ totalCandidates: uniqueCandidates, totalApplications: filteredApps.length, activeJobs: activeJobsCount, avgMatchScore })
      setFunnelData(mappedFunnel)
      setDistributionData(mappedDistribution)
      setJobPerformance(formattedPerf)
      setInsights(computedInsights)
 
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, selectedJobId, dateRange])
 
  useEffect(() => { loadAnalyticsData() }, [loadAnalyticsData])
 
  const handleRefresh = () => {
    setRefreshing(true)
    loadAnalyticsData()
  }
 
  // ── Custom bar label for job performance ──
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props
    return (
      <text x={x + width + 6} y={y + 11} fill="#64748B" fontSize={11} fontFamily="monospace" fontWeight={700}>
        {value}%
      </text>
    )
  }
 
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 16 }}>
        <Loader2 className="animate-spin" size={36} color="#6366F1" />
        <p style={{ color: '#6B7DB8', fontSize: 13, fontWeight: 500 }}>Aggregating recruitment intelligence…</p>
      </div>
    )
  }
 
  if (error) {
    return (
      <div style={{ margin: '48px auto', maxWidth: 480, padding: '20px 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'flex-start', color: '#FCA5A5' }}>
        <AlertCircle size={22} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Dashboard failed to load</p>
          <p style={{ fontSize: 12, opacity: 0.75 }}>{error}</p>
        </div>
      </div>
    )
  }
 
  return (
    <div style={{ maxWidth: 1200, paddingBottom: 64, fontFamily: 'Inter, system-ui, sans-serif' }}>
 
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 10, padding: 7, display: 'flex' }}>
              <BarChart3 size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', letterSpacing: -0.5, margin: 0 }}>
              Recruitment Intelligence
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>
            Real-time pipeline analytics · AI-powered matching insights
          </p>
        </div>
 
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date range */}
          <div style={{ position: 'relative' }}>
            <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366F1', pointerEvents: 'none' }} />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{ appearance: 'none', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 28px 7px 28px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
 
          {/* Job filter */}
          <div style={{ position: 'relative' }}>
            <Briefcase size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366F1', pointerEvents: 'none' }} />
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              style={{ appearance: 'none', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 28px 7px 28px', fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer', maxWidth: 180 }}
            >
              <option value="all">All positions</option>
              {jobOptions.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
 
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.2s' }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>
 
      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Candidate Pool', value: stats.totalCandidates, sub: 'unique applicants', icon: Users, accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
          { label: 'Applications', value: stats.totalApplications, sub: 'total received', icon: Layers, accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
          { label: 'Active Openings', value: stats.activeJobs, sub: 'live positions', icon: Briefcase, accent: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
          { label: 'Avg Match Score', value: `${stats.avgMatchScore}%`, sub: 'across applicants', icon: TrendingUp, accent: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'applied → offered', icon: CheckCircle2, accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            style={{ background: '#fff', border: `1px solid ${stat.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94A3B8', margin: '0 0 6px 0' }}>{stat.label}</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: '#1E293B', margin: '0 0 2px 0', fontFamily: 'monospace', letterSpacing: -1 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{stat.sub}</p>
            </div>
            <div style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={20} color={stat.accent} />
            </div>
          </motion.div>
        ))}
      </div>
 
      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
 
        {/* Funnel Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Layers size={15} color="#6366F1" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: 0 }}>Hiring Funnel</h3>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 18px 0' }}>Stage-by-stage progression with drop-off rates</p>
 
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {funnelData.map((stage, i) => (
                <FunnelStep
                  key={stage.name}
                  stage={stage.name}
                  value={stage.value}
                  prevValue={i > 0 ? funnelData[i - 1].value : null}
                  color={stage.color}
                  isLast={i === funnelData.length - 1}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <HealthRing score={pipelineHealth} />
              <p style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center', margin: 0, maxWidth: 90, lineHeight: 1.4, letterSpacing: 0.5 }}>
                PIPELINE HEALTH SCORE
              </p>
            </div>
          </div>
        </motion.div>
 
        {/* Match Score Histogram */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: 6, display: 'flex' }}>
              <BarChart3 size={15} color="#6366F1" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: 0 }}>Match Score Distribution</h3>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 12px 0' }}>Histogram of AI compatibility scores across applicants</p>
 
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#CBD5E1" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#CBD5E1" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 6 }} />
                <ReferenceLine y={stats.totalApplications / 5} stroke="#6366F1" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={52}>
                  {distributionData.map((entry, i) => (
                    <Cell key={`dist-${i}`} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
 
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {distributionData.map(d => (
              <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748B' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                {d.name}%
              </span>
            ))}
          </div>
        </motion.div>
      </div>
 
      {/* ── Bottom Row: Job Performance + Insights ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
 
        {/* Job Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Award size={15} color="#10B981" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', margin: 0 }}>Position Performance Ranking</h3>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 16px 0' }}>Ranked by average AI match compatibility score</p>
 
          {jobPerformance.length > 0 ? (
            <>
              <div style={{ height: 200, marginBottom: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={jobPerformance.slice(0, 6)}
                    margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#CBD5E1" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <YAxis
                      dataKey="title"
                      type="category"
                      stroke="#CBD5E1"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} maxBarSize={20} label={renderCustomBarLabel}>
                      {jobPerformance.slice(0, 6).map((entry, i) => (
                        <Cell
                          key={`perf-${i}`}
                          fill={entry.avgScore >= 80 ? '#10B981' : entry.avgScore >= 60 ? '#6366F1' : '#F59E0B'}
                          fillOpacity={1 - i * 0.08}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
 
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['#', 'Position', 'Applications', 'Avg Score'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Applications' || h === 'Avg Score' ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobPerformance.map(job => (
                      <tr key={job.jobId} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '8px 8px', width: 32 }}>
                          <span style={{ fontSize: 13 }}>
                            {job.rank === 1 ? '🥇' : job.rank === 2 ? '🥈' : job.rank === 3 ? '🥉' : <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: 11 }}>{job.rank}</span>}
                          </span>
                        </td>
                        <td style={{ padding: '8px 8px', fontWeight: 600, color: '#1E293B', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>{job.applicationsCount}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                            background: job.avgScore >= 80 ? 'rgba(16,185,129,0.1)' : job.avgScore >= 60 ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                            color: job.avgScore >= 80 ? '#10B981' : job.avgScore >= 60 ? '#6366F1' : '#F59E0B'
                          }}>
                            {job.avgScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {jobPerformance.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 12 }}>No positions to rank yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
              No positions posted yet.
            </div>
          )}
        </motion.div>
 
        {/* Key Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ background: 'linear-gradient(160deg, #0B1437 0%, #131C4A 100%)', border: '1px solid #1E2D6E', borderRadius: 16, padding: '22px 22px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Zap size={15} color="#818CF8" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#E2E8F0', margin: 0 }}>Key Insights</h3>
          </div>
          <p style={{ fontSize: 11, color: '#4B5DA8', margin: '0 0 18px 0' }}>AI-generated from your live pipeline data</p>
 
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
            <AnimatePresence>
              {insights.map((insight, i) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  style={{
                    background: insight.type === 'success' ? 'rgba(16,185,129,0.08)' : insight.type === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                    border: `1px solid ${insight.type === 'success' ? 'rgba(16,185,129,0.2)' : insight.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{insight.icon}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: 0.3,
                      color: insight.type === 'success' ? '#34D399' : insight.type === 'warning' ? '#FBBF24' : '#A5B4FC'
                    }}>
                      {insight.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, lineHeight: 1.55 }}>{insight.desc}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
 
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #1E2D6E', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Info size={11} color="#3D4F8C" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 10, color: '#3D4F8C', margin: 0, lineHeight: 1.5 }}>
              Insights computed dynamically from active funnel stages and AI semantic match scores.
            </p>
          </div>
        </motion.div>
      </div>
 
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select:focus { outline: 2px solid #6366F1; outline-offset: 1px; }
        button:hover:not(:disabled) { background: #4F46E5 !important; }
        tr:hover td { background: #F8FAFF; }
      `}</style>
    </div>
  )
}
 