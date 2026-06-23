import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Settings, CheckCircle
} from 'lucide-react'

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigation = (_itemId: string, path: string) => {
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-xs text-slate-900/40 mt-1">Platform Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                            (item.path === '/admin' && location.pathname === '/admin')
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id, item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-slate-900/60 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-violet-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-violet-500" />
              <span className="text-xs font-semibold text-violet-700">System Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-600">All systems operational</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
