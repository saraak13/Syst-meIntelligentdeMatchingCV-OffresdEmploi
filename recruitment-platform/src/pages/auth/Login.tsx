import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Eye, EyeOff, ArrowRight, Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'
import { cn } from '../../lib/utils'

// 📸 Import the Biometric Authentication Modal Component
import { FaceAuthModal } from '../../components/shared/FaceAuthModal'

const demoAccounts: { role: Role; email: string; label: string; color: string }[] = [
  { role: 'candidate', email: 'sarah.chen@email.com', label: 'Candidate', color: 'from-blue-500 to-cyan-500' },
  { role: 'recruiter', email: 'marcus@techcorp.com', label: 'Recruiter', color: 'from-violet-500 to-indigo-500' },
  { role: 'admin', email: 'admin@recruitai.com', label: 'Admin', color: 'from-emerald-500 to-teal-500' },
]

export function LoginPage() {
  // 🛠️ FIX: Replaced 'setUser' with your context's real tracking action 'updateUser'
  const { login, updateUser } = useAuth() 
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [role, setRole] = useState<Role>('candidate')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 📸 State tracking hook managing biometric validation overlays
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))
    const ok = await login(email, password, role)
    if (ok) {
      navigate(`/${role}`)
    } else {
      setError('Invalid credentials. Please verify your details or use a demo account.')
    }
    setLoading(false)
  }

  const handleDemo = (d: typeof demoAccounts[0]) => {
    setEmail(d.email)
    setRole(d.role)
    setPassword('demo123')
  }

  // 📸 Success callback handler to process passwordless, anonymous biometric validation tokens
  const handleFaceAuthSuccess = (backendUser: any) => {
    if (!backendUser) return

    // 🛠️ Map raw backend database fields into the precise shape your frontend dashboard layout expects:
    const formattedUser = {
      id: backendUser.id,
      name: `${backendUser.first_name} ${backendUser.last_name}`.trim() || 'User',
      email: backendUser.email,
      role: backendUser.role as Role,
      company: backendUser.company || undefined,
      location: backendUser.location || undefined,
      avatar: backendUser.avatar_url || undefined,
      createdAt: backendUser.created_at || new Date().toISOString()
    }

    // 1. Force state synchronization across the app context via updateUser so the layout and sidebar hydrate instantly
    if (typeof updateUser === 'function') {
      updateUser(formattedUser)
    }

    // 2. Dynamically navigate to the backend-identified user role route dashboard layout
    navigate(`/${formattedUser.role}`)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto ai-glow">
            <Sparkles size={24} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-900/40 mt-1">Sign in to RecruitAI</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 backdrop-blur-xl p-6 space-y-5">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2">
            {(['candidate', 'recruiter', 'admin'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'py-2 rounded-xl text-xs font-medium capitalize transition-all border',
                  role === r
                    ? 'bg-violet-500 border-violet-500 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-900/40 hover:text-slate-900/70 hover:border-slate-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50 font-medium">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-900/20 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-900/20 focus:outline-none focus:border-violet-500/50 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-900/30 hover:text-slate-900/60"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-900/40 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-violet-500 hover:text-violet-600 transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-slate-900 font-medium text-sm shadow-md transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={14} /></>
                )}
              </button>

              {/* 📸 NEW: Completely email-free, click-and-scan instant biometric trigger */}
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setIsFaceModalOpen(true) // 🚀 Fires webcam loop completely empty of constraint validations!
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-50 text-violet-600 font-medium text-sm transition-all"
              >
                <Camera size={15} />
                Sign in with FaceID
              </button>
            </div>
          </form>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-900/30">Quick demo access</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map(d => (
              <button
                key={d.role}
                type="button"
                onClick={() => handleDemo(d)}
                className={cn(
                  'py-2 px-3 rounded-xl text-xs font-medium text-slate-900 bg-gradient-to-r transition-all hover:opacity-90 hover:scale-[1.02] shadow-sm',
                  d.color
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-900/30">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-500 hover:text-violet-600 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>

      {/* 📸 Mounted Biometric Portal */}
      <FaceAuthModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onAuthSuccess={handleFaceAuthSuccess}
      />
    </div>
  )
}