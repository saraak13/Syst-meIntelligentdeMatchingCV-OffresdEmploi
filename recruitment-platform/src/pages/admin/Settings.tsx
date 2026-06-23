import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Database, Globe, Mail, Palette, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export function AdminSettings() {
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const settingsSections = [
    {
      id: 'general',
      title: 'General Settings',
      icon: Globe,
      items: [
        { label: 'Platform Name', type: 'text', value: 'RecruitAI', description: 'Name displayed across the platform' },
        { label: 'Default Language', type: 'select', value: 'en', options: ['en', 'fr', 'es', 'de'], description: 'Default language for new users' },
        { label: 'Timezone', type: 'select', value: 'UTC', options: ['UTC', 'EST', 'PST', 'CET'], description: 'Platform default timezone' },
        { label: 'Maintenance Mode', type: 'toggle', value: false, description: 'Disable platform for maintenance' },
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      items: [
        { label: 'Email Notifications', type: 'toggle', value: true, description: 'Send email notifications for important events' },
        { label: 'SMS Alerts', type: 'toggle', value: false, description: 'Send SMS alerts for critical security events' },
        { label: 'Push Notifications', type: 'toggle', value: true, description: 'Enable browser push notifications' },
        { label: 'Digest Frequency', type: 'select', value: 'daily', options: ['daily', 'weekly', 'monthly'], description: 'Frequency of activity digests' },
      ]
    },
    {
      id: 'email',
      title: 'Email Configuration',
      icon: Mail,
      items: [
        { label: 'SMTP Server', type: 'text', value: 'smtp.gmail.com', description: 'Outgoing mail server address' },
        { label: 'SMTP Port', type: 'text', value: '587', description: 'SMTP server port' },
        { label: 'Sender Email', type: 'email', value: 'noreply@recruitai.com', description: 'Default sender email address' },
        { label: 'Email Templates', type: 'toggle', value: true, description: 'Use custom email templates' },
      ]
    },
    {
      id: 'database',
      title: 'Database Settings',
      icon: Database,
      items: [
        { label: 'Backup Frequency', type: 'select', value: 'daily', options: ['hourly', 'daily', 'weekly'], description: 'Automated backup schedule' },
        { label: 'Retention Period', type: 'select', value: '90', options: ['30', '60', '90', '180'], description: 'Days to retain backup data' },
        { label: 'Auto-Optimization', type: 'toggle', value: true, description: 'Automatically optimize database tables' },
        { label: 'Query Logging', type: 'toggle', value: false, description: 'Log all database queries for debugging' },
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Primary Color', type: 'color', value: '#8b5cf6', description: 'Main brand color' },
        { label: 'Secondary Color', type: 'color', value: '#3b82f6', description: 'Secondary accent color' },
        { label: 'Dark Mode', type: 'toggle', value: false, description: 'Enable dark mode theme' },
        { label: 'Compact Mode', type: 'toggle', value: false, description: 'Use compact layout for dense information' },
      ]
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
            <p className="text-slate-900/40 text-sm mt-1">Configure platform-wide settings and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <RefreshCw size={16} />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle size={16} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const Icon = section.icon
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-50">
                  <Icon size={20} className="text-violet-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-slate-900">{item.label}</label>
                      <p className="text-xs text-slate-900/40 mt-1">{item.description}</p>
                    </div>
                    <div className="ml-4">
                      {item.type === 'text' && (
                        <input
                          type="text"
                          defaultValue={item.value as string}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-48"
                        />
                      )}
                      {item.type === 'email' && (
                        <input
                          type="email"
                          defaultValue={item.value as string}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-48"
                        />
                      )}
                      {item.type === 'select' && (
                        <select
                          defaultValue={item.value as string}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-32"
                        >
                          {item.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {item.type === 'toggle' && (
                        <button
                          className={`w-12 h-6 rounded-full transition-colors ${
                            item.value ? 'bg-violet-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              item.value ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      )}
                      {item.type === 'color' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            defaultValue={item.value as string}
                            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                          />
                          <span className="text-xs text-slate-900/60 font-mono">{item.value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 bg-white hover:bg-red-50 rounded-xl border border-red-200 transition-colors">
            <RefreshCw size={18} className="text-red-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">Clear All Caches</p>
              <p className="text-xs text-slate-900/60">Clear Redis and application caches</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-white hover:bg-red-50 rounded-xl border border-red-200 transition-colors">
            <Database size={18} className="text-red-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">Reset Database</p>
              <p className="text-xs text-slate-900/60">⚠️ This will delete all data</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
