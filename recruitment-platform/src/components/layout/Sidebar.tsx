import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, Briefcase, MessageSquare, User,
  ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Users, FileText, BarChart3, Shield,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const navItems = {
  candidate: [
    { to: '/candidate', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/candidate/upload', icon: Upload, label: 'Upload CV' },
    { to: '/candidate/jobs', icon: Briefcase, label: 'Job Matches' },
    { to: '/candidate/applications', icon: ClipboardList, label: 'Applications' },
    { to: '/candidate/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/candidate/profile', icon: User, label: 'My Profile' },
  ],
  recruiter: [
    { to: '/recruiter', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/recruiter/jobs', icon: FileText, label: 'Job Offers' },
    { to: '/recruiter/candidates', icon: Users, label: 'Candidates' },
    
    { to: '/recruiter/chat', icon: MessageSquare, label: 'AI Assistant' },
  ],
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/security', icon: Shield, label: 'Security' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const items = user ? navItems[user.role] : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen bg-white border-r border-slate-200 flex-shrink-0 overflow-hidden transition-colors duration-300"
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-5 border-b border-slate-200', collapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ai-glow">
          <Sparkles size={16} className="text-slate-900" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <span className="font-bold text-slate-900 text-sm tracking-tight">RecruitAI</span>
              <p className="text-[10px] text-slate-500 leading-none">Intelligent Hiring</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                collapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-violet-500/20 text-violet-700 border border-violet-500/30'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={cn(isActive ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-600', 'flex-shrink-0')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name}
              className="w-7 h-7 rounded-full flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
