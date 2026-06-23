import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Eye, EyeOff, Phone, MapPin, Briefcase, Loader2, Camera, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'
import { cn } from '../../lib/utils'

// 📸 Import the Biometric Registration Setup Modal
import { FaceSetupModal } from '../../components/shared/FaceSetupModal'

export const presetLocations = [
  'Paris, France',
  'London, UK',
  'New York, USA',
  'San Francisco, USA',
  'Berlin, Germany',
  'Casablanca, Morocco',
  'Remote'
]

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [role, setRole] = useState<Role>('candidate')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [company, setCompany] = useState('')
  
  // 📸 FaceID Biometric registration capture pipeline states
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false)

  // Profile Picture Upload State (Base64)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [avatarFileName, setAvatarFileName] = useState('')

  // GeoDB Autocomplete States
  const [locationSearch, setLocationSearch] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Debounced Auto-complete City Fetching from GeoDB API
  useEffect(() => {
    if (locationSearch.trim().length < 2) {
      setLocationSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const response = await fetch(
          `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(locationSearch)}&limit=5`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com',
              'x-rapidapi-key': 'f62c9d6a09msha6443048351aea3p112273jsnc5df093a80e6'
            }
          }
        )

        if (response.ok) {
          const json = await response.json()
          if (json && json.data) {
            const list = json.data.map((item: any) => `${item.city}, ${item.country}`)
            setLocationSuggestions(list)
            setShowSuggestions(true)
          }
        }
      } catch (err) {
        console.error("GeoDB Fetch Error:", err)
      } finally {
        setSuggestionsLoading(false)
      }
    }, 400) // 400ms Debounce

    return () => clearTimeout(delayDebounceFn)
  }, [locationSearch])

  // Handle click outside of dropdown to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectSuggestion = (city: string) => {
    setLocationSearch(city)
    setShowSuggestions(false)
  }

  // Handle Profile Picture selection and base64 encoding
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB")
        return
      }
      setAvatarFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarBase64(null)
    setAvatarFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 💡 Note: Your global useAuth register handler function signature needs to accept 
    // a 9th positional parameter argument mapping to pass faceImage down to the backend.
    const ok = await register(
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber || undefined,
      avatarBase64 || undefined, 
      role === 'recruiter' ? company : undefined,
      locationSearch || 'Remote',
      faceImage || undefined // 📸 Appended as the biometric signature token field payload
    )

    if (ok) {
      navigate(`/${role}`)
    } else {
      setError('Registration failed. Please make sure the email is not already registered.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blur rings */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6 my-8"
      >
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/10">
            <Sparkles size={24} className="text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-900/40 mt-1">Join the ultimate AI Recruitment SaaS platform</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 backdrop-blur-xl p-6 space-y-5 shadow-xl shadow-slate-100">
          {/* Role selector */}
          <div>
            <label className="text-xs text-slate-900/50 font-semibold block mb-2 uppercase tracking-wider">I want to register as a...</label>
            <div className="grid grid-cols-2 gap-2">
              {(['candidate', 'recruiter'] as Role[]).map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-semibold capitalize transition-all border',
                    role === r
                      ? 'bg-violet-500 border-violet-500 text-slate-900 shadow-md shadow-violet-500/15'
                      : 'border-slate-200 bg-white text-slate-900/40 hover:text-slate-900/70 hover:border-slate-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 🛠️ Dynamic Flex row holding Profile Avatar Upload + FaceID Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Profile Picture Upload Section */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900/50 font-medium block">Profile Picture</label>
                <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-200 rounded-xl h-[74px] shadow-sm">
                  <div className="relative group shrink-0">
                    {avatarBase64 ? (
                      <img
                        src={avatarBase64}
                        alt="Avatar Preview"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
                        <Camera size={14} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-md text-[11px] font-semibold border border-violet-200 transition-colors"
                      >
                        Upload
                      </button>
                      {avatarBase64 && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-100 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">
                      {avatarFileName ? avatarFileName : "Max 2MB"}
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 📸 NEW: FaceID Biometric Scan Section */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-900/50 font-medium block">Biometric Security</label>
                <div className="flex flex-col justify-center bg-white p-2.5 border border-slate-200 rounded-xl h-[74px] shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsFaceModalOpen(true)}
                    className={cn(
                      "w-full py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                      faceImage 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Camera size={14} className={faceImage ? "text-emerald-500" : "text-violet-500"} />
                    {faceImage ? "FaceID Linked Successfully" : "Configure FaceID"}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center mt-1">
                    {faceImage ? "Ready for fast sign-in scan" : "Unlock fast passwordless login"}
                  </p>
                </div>
              </div>

            </div>

            {/* Identity details (First/Last Names) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 font-medium">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  placeholder="Jane"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 font-medium">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 font-medium">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 font-medium">Phone number (optional)</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+212 6 12 34 56 78"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic GeoDB Location Auto-complete Input Box */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-xs text-slate-900/50 font-medium">Location</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={e => {
                    setLocationSearch(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  required
                  placeholder="Start typing your city... (e.g. Casablanca)"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                />
                {suggestionsLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="text-violet-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && locationSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                  >
                    {locationSuggestions.map(city => (
                      <button
                        type="button"
                        key={city}
                        onClick={() => selectSuggestion(city)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-violet-500/10 text-slate-900 hover:text-violet-700 transition-all font-medium border-b border-slate-50 last:border-0"
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recruiter specific Company field */}
            {role === 'recruiter' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-900/50 font-medium">Company</label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                    placeholder="TechCorp Solutions"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-slate-900/50 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200/50 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <p className="text-[11px] text-slate-900/35">
              By creating an account you agree to our{' '}
              <span className="text-violet-500 cursor-pointer hover:underline">Terms</span> and{' '}
              <span className="text-violet-500 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-slate-900 font-semibold text-sm transition-all shadow-md shadow-violet-500/15"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-900/35">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-500 font-semibold hover:text-violet-600">
            Sign in
          </Link>
        </p>
      </motion.div>

      {/* 📸 Biometric Baseline Registration Setup Modal Mount */}
      <FaceSetupModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onCaptureComplete={(base64Data) => setFaceImage(base64Data)}
      />
    </div>
  )
}