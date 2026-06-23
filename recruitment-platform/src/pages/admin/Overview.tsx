import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Briefcase, FileText, TrendingUp, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeCVs: 0,
    pendingReviews: 0,
    systemHealth: 'operational'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalUsers: data.users.total,
          totalJobs: data.jobs.total,
          totalApplications: data.applications.total,
          activeCVs: data.users.candidates, // Using candidates as proxy for active CVs
          pendingReviews: data.applications.pending,
          systemHealth: data.system.db_status === 'Connected' ? 'operational' : 'error'
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-900/40 text-sm">Loading overview...</div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', change: '+12%' },
    { label: 'Active Jobs', value: stats.totalJobs, icon: Briefcase, color: 'text-violet-400', change: '+5%' },
    { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'text-emerald-400', change: '+23%' },
    { label: 'CVs Analyzed', value: stats.activeCVs, icon: Activity, color: 'text-amber-400', change: '+18%' },
  ]

  const recentActivity = [
    { id: 1, type: 'user_registration', message: 'New user registered: sarah.chen@email.com', time: '2 min ago', status: 'success' },
    { id: 2, type: 'job_posted', message: 'New job posted: Senior Python Developer', time: '15 min ago', status: 'success' },
    { id: 3, type: 'application', message: 'Application received for ML Engineer position', time: '32 min ago', status: 'success' },
    { id: 4, type: 'system_alert', message: 'Database backup completed', time: '1 hour ago', status: 'info' },
    { id: 5, type: 'security', message: 'Failed login attempt detected', time: '2 hours ago', status: 'warning' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-900/40 text-sm mt-1">Platform performance and activity metrics</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-900/40">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-xl bg-slate-50 ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">{stat.change}</span>
                <span className="text-slate-900/40">vs last month</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* System Health & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900">System Health</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">API Server</p>
                  <p className="text-xs text-slate-900/40">Operational - 99.9% uptime</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Database</p>
                  <p className="text-xs text-slate-900/40">Connected - Response time: 12ms</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">CV Processing Queue</p>
                  <p className="text-xs text-slate-900/40">{stats.pendingReviews} files pending</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Pending Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900">Pending Actions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-violet-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Review Applications</p>
                  <p className="text-xs text-slate-900/40">{stats.pendingReviews} need attention</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1.5 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors">
                Review
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">User Verification</p>
                  <p className="text-xs text-slate-900/40">5 accounts pending verification</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Verify
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Content Moderation</p>
                  <p className="text-xs text-slate-900/40">2 job posts need review</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1.5 bg-slate-500 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors">
                Review
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
            >
              <div className={`p-2 rounded-lg ${
                activity.status === 'success' ? 'bg-emerald-100' :
                activity.status === 'warning' ? 'bg-amber-100' :
                'bg-blue-100'
              }`}>
                {activity.status === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
                {activity.status === 'warning' && <AlertCircle size={16} className="text-amber-500" />}
                {activity.status === 'info' && <Clock size={16} className="text-blue-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">{activity.message}</p>
                <p className="text-xs text-slate-900/40">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
