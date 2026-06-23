import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Code, Link as LinkIcon, Globe, Mail, Phone, MapPin, AlertCircle, Briefcase } from 'lucide-react'
import { SkillBadge } from '../../components/shared/SkillBadge'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Split context name into first & last name
  const nameParts = user?.name ? user.name.split(' ') : ['', '']
  const initialFirstName = nameParts[0] || ''
  const initialLastName = nameParts.slice(1).join(' ') || ''

  // Local Editable Profile State
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [location, setLocation] = useState(user?.location || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [company, setCompany] = useState(user?.company || '')

  // Dynamic CV data fetched from backend
  const [title, setTitle] = useState('Software Professional')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [noCv, setNoCv] = useState(false)

  // 1. Fetch CV details and populate dynamic fields
  useEffect(() => {
    if (!user) return
    
    // Sync basic info if context updates
    setFirstName(initialFirstName)
    setLastName(initialLastName)
    setLocation(user.location || '')
    setEmail(user.email || '')
    setAvatar(user.avatar || '')
    setCompany(user.company || '')

    const fetchCv = async () => {
      try {
        const response = await fetch(`/api/cvs/user/${user.id}`)
        if (response.ok) {
          const cv = await response.json()
          const parsed = cv.parsed_json || {}
          
          setTitle(parsed.title || 'Software Professional')
          setSummary(parsed.summary || parsed.bio || 'Experienced developer with solid skills.')
          
          if (parsed.contact?.phone) {
            setPhone(parsed.contact.phone)
          }

          // Format technical skills for display
          const rawSkills = parsed.technical_skills || {}
          const formattedSkills: any[] = []
          Object.entries(rawSkills).forEach(([category, list]: any) => {
            if (Array.isArray(list)) {
              list.forEach(skillName => {
                formattedSkills.push({ name: skillName, level: 'Advanced', category })
              })
            }
          })
          setSkills(formattedSkills)

          // Format experiences
          const rawExp = parsed.work_experience || []
          setExperiences(rawExp.map((exp: any, index: number) => ({
            id: index,
            title: exp.position || 'Software Engineer',
            company: exp.company || 'Not Specified',
            location: 'Remote',
            startDate: exp.period ? exp.period.split('–')[0] || exp.period : '2023',
            endDate: exp.period ? exp.period.split('–')[1] || 'Present' : 'Present',
            current: exp.period ? !exp.period.includes('Present') : true,
            description: Array.isArray(exp.tasks) ? exp.tasks.join(', ') : (exp.tasks || '')
          })))
          setNoCv(false)
        } else if (response.status === 404) {
          setNoCv(true)
        }
      } catch (err) {
        console.error("Error fetching CV details:", err)
      }
    }

    fetchCv()
  }, [user])

  // 2. Handle base64 avatar image upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatar(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 3. Save profile changes to the backend
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const response = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          location: location,
          company: company,
          avatar_url: avatar
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          updateUser({
            ...user,
            name: `${data.user.first_name} ${data.user.last_name}`,
            location: data.user.location || undefined,
            company: data.user.company || undefined,
            avatar: data.user.avatar_url || undefined
          })
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        }
      } else {
        alert("Failed to save changes. Please try again.")
      }
    } catch (err) {
      console.error("Error saving profile details:", err)
      alert("Error saving profile details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-900/40 text-sm mt-1">Keep your profile updated to improve job matches</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-slate-900 text-sm font-medium transition-all"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : <><Save size={14} /> Save Changes</>}
        </button>
      </motion.div>

      {/* Notice if no CV is uploaded */}
      {noCv && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-violet-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Auto-fill your profile instantly</p>
              <p className="text-xs text-slate-500">Upload your CV PDF to automatically extract your skills, experiences, job title, and professional summary!</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/candidate/cv')}
            className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-slate-900 rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Upload CV
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: Avatar & Quick info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4 text-center">
            <div className="relative mx-auto w-24 h-24 group">
              <img
                src={avatar || "/placeholder_avatar.png"}
                alt={firstName}
                className="w-full h-full rounded-full object-cover ring-4 ring-violet-500/30 transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=8B5CF6&color=fff`;
                }}
              />
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-slate-900 text-xs hover:bg-violet-600 transition-colors cursor-pointer shadow-lg">
                +
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{firstName} {lastName}</p>
              <p className="text-sm text-violet-400 font-medium">{title}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Links</h3>
            {[
              { icon: Code, label: 'GitHub', value: 'github.com/profile', placeholder: 'github.com/username' },
              { icon: LinkIcon, label: 'LinkedIn', value: 'linkedin.com/in/profile', placeholder: 'linkedin.com/in/name' },
              { icon: Globe, label: 'Portfolio', value: 'portfolio.com', placeholder: 'yoursite.com' },
            ].map(link => (
              <div key={link.label} className="flex items-center gap-2">
                <link.icon size={15} className="text-slate-900/30 flex-shrink-0" />
                <input
                  defaultValue={link.value}
                  placeholder={link.placeholder}
                  className="flex-1 bg-transparent text-sm text-slate-900/70 placeholder-white/20 focus:outline-none border-b border-slate-200 focus:border-violet-500/50 pb-1 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50">First Name</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50">Last Name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 flex items-center gap-1"><Mail size={10} /> Email</label>
                <input 
                  value={email} 
                  disabled
                  title="Email cannot be modified"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 focus:outline-none cursor-not-allowed" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 flex items-center gap-1"><Phone size={10} /> Phone</label>
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500/50 transition-colors" 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50 flex items-center gap-1"><MapPin size={10} /> Location</label>
              <input 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="City, Country"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500/50 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50 flex items-center gap-1"><Briefcase size={10} /> Company</label>
              <input 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                placeholder="Current Company"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500/50 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50">Professional Summary</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={3}
                placeholder="Professional summary extracted from your CV..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Dynamic extracted Skills */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Extracted Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <SkillBadge key={s.name} skill={s} showLevel />
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-slate-400 italic">No skills extracted. Upload your CV to auto-populate.</p>
              )}
            </div>
          </div>

          {/* Dynamic extracted Experience */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Extracted Experience</h3>
            {experiences.map(exp => (
              <div key={exp.id} className="flex gap-3 p-3 rounded-xl bg-white/40 hover:bg-slate-100 transition-colors group border border-slate-150">
                <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{exp.title}</p>
                  <p className="text-xs text-violet-500 font-medium">{exp.company}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exp.startDate} – {exp.endDate}</p>
                  {exp.description && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
            {experiences.length === 0 && (
              <p className="text-xs text-slate-400 italic">No experiences extracted. Upload your CV to auto-populate.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
