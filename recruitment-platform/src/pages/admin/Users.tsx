import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MoreVertical, UserPlus, Shield, Ban, CheckCircle, Mail, Calendar } from 'lucide-react'

export function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, []) // Fetch on mount

  useEffect(() => {
    if (filterRole !== 'all' || searchTerm) {
      fetchUsers()
    }
  }, [filterRole, searchTerm]) // Refetch when filters change

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole !== 'all') params.append('role', filterRole)
      if (searchTerm) params.append('search', searchTerm)
      
      console.log('Fetching users from:', `/api/admin/users?${params.toString()}`)
      const response = await fetch(`/api/admin/users?${params.toString()}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched users:', data)
        setUsers(data.map((user: any) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: 'active',
          joined: new Date(user.created_at).toISOString().split('T')[0],
          lastActive: 'Active'
        })))
      } else {
        console.error('Failed to fetch users:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailUser = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (response.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    // Note: Backend doesn't have a status field, so this is a placeholder
    // In a real implementation, you'd need to add a status field to the User model
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-900/40 text-sm">Loading users...</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400'
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      case 'suspended': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-violet-500/20 text-violet-400'
      case 'recruiter': return 'bg-blue-500/20 text-blue-400'
      case 'candidate': return 'bg-emerald-500/20 text-emerald-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-900/40 text-sm mt-1">Manage platform users and permissions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors">
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-blue-400' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'text-emerald-400' },
          { label: 'Pending', value: users.filter(u => u.status === 'pending').length, color: 'text-amber-400' },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: 'text-red-400' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-900/40">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4"
      >
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900/40" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="candidate">Candidate</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-900/60 px-6 py-4">User</th>
              <th className="text-left text-xs font-semibold text-slate-900/60 px-6 py-4">Role</th>
              <th className="text-left text-xs font-semibold text-slate-900/60 px-6 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-slate-900/60 px-6 py-4">Joined</th>
              <th className="text-left text-xs font-semibold text-slate-900/60 px-6 py-4">Last Active</th>
              <th className="text-right text-xs font-semibold text-slate-900/60 px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-violet-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-900/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-900/60">
                    <Calendar size={12} />
                    {user.joined}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-900/60">{user.lastActive}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEmailUser(user.email)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
                      title="Send Email"
                    >
                      <Mail size={14} className="text-slate-900/60" />
                    </button>
                    <button 
                      onClick={() => handleUpdateRole(user.id, user.role === 'candidate' ? 'recruiter' : 'candidate')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
                      title="Toggle Role"
                    >
                      <Shield size={14} className="text-slate-900/60" />
                    </button>
                    {user.status === 'active' ? (
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Suspend User"
                      >
                        <Ban size={14} className="text-red-400" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleStatus(user)}
                        className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" 
                        title="Activate User"
                      >
                        <CheckCircle size={14} className="text-emerald-400" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <MoreVertical size={14} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-900/40 text-sm">
            No users found matching your criteria
          </div>
        )}
      </motion.div>
    </div>
  )
}
