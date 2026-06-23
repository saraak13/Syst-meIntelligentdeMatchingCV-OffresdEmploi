import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

export function Navbar() {

  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between gap-4 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      {/* Search */}
      <div className="relative max-w-sm w-full hidden sm:flex items-center">
        <Search size={14} className="absolute left-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search candidates, jobs…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500/50 focus:bg-white transition-all"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">


        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {/* Avatar */}
        {user && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 pl-2 cursor-pointer"
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name}
              className="w-8 h-8 rounded-full ring-2 ring-violet-500/30"
            />
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize leading-tight">{user.role}</p>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}
