import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Sparkles, CheckCircle, ChevronRight, MapPin } from 'lucide-react'
import { UploadDropzone } from '../../components/shared/UploadDropzone'
import { SkillBadge } from '../../components/shared/SkillBadge'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const parseSteps = [
  { label: 'Extracting personal info', delay: 0 },
  { label: 'Parsing skills and technologies', delay: 0.4 },
  { label: 'Analyzing work experience', delay: 0.8 },
  { label: 'Processing education history', delay: 1.2 },
  { label: 'Generating embeddings', delay: 1.6 },
  { label: 'Computing semantic vectors', delay: 2.0 },
]

export function CVUploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [parsed, setParsed] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)

  const handleUpload = async (file: File) => {
    if (!user) {
      alert("Please log in first to upload your CV.")
      return
    }
    setParsing(true)
    setParsed(false)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", user.id)

    try {
      const response = await fetch('/api/cvs/upload', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        const data = await response.json()
        setParsedData(data.parsed_json)
        setParsed(true)
      } else {
        let errMsg = "Internal Server Error"
        try {
          const errDetail = await response.json()
          errMsg = errDetail.detail || errMsg
        } catch (_) {}
        alert(`Failed to parse CV: ${errMsg}`)
      }
    } catch (err) {
      console.error(err)
      alert("Network connection error. Please verify your backend server is active on port 8001.")
    } finally {
      setParsing(false)
    }

  }

  // Fallbacks in case parsed fields are structured slightly differently
  const fullName = parsedData?.full_name || user?.name || "Professional"
  const title = parsedData?.title || parsedData?.professional_summary || "Professional Profile"
  const location = parsedData?.contact?.location || parsedData?.location || "Not specified"
  const skills = parsedData?.technical_skills || parsedData?.skills || []
  const experiences = parsedData?.work_experience || parsedData?.experience || []

  return (
    <div className="max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Upload Your CV</h1>
        <p className="text-slate-900/40 text-sm mt-1">Our AI will parse and analyze your CV automatically</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <UploadDropzone onUpload={handleUpload} />

          {/* Parse steps */}
          {(parsing || parsed) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles size={15} className="text-violet-400" />
                AI CV Parsing
              </div>
              {parseSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay }}
                  className="flex items-center gap-3 text-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step.delay + 0.2 }}
                  >
                    {parsed || i < 4 ? (
                      <CheckCircle size={15} className="text-emerald-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-500/40 border-t-violet-500 animate-spin" />
                    )}
                  </motion.div>
                  <span className={parsed || i < 4 ? 'text-slate-900/70' : 'text-slate-900/30'}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Parsed result */}
        {parsed && parsedData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Profile card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle size={16} />
                CV Successfully Parsed
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-600 ring-2 ring-slate-200 uppercase">
                  {fullName.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{fullName}</p>
                  <p className="text-sm text-violet-400">{title}</p>
                  <p className="text-xs text-slate-900/40 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />
                    {location}
                  </p>
                </div>
              </div>
            </div>

            {/* Extracted skills */}
            {skills.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText size={14} className="text-violet-400" />
                  Extracted Skills ({skills.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s: string) => (
                    <SkillBadge key={s} skill={{ name: s, level: 'intermediate', category: 'Skill' }} showLevel={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Experience</h3>
                <div className="space-y-3">
                  {experiences.map((exp: any, i: number) => {
                    const jobTitle = exp.job_title || exp.position || exp.title || "Experience"
                    const company = exp.company || "Not specified"
                    const duration = exp.duration || `${exp.start_date || ''} - ${exp.end_date || ''}`
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-violet-500 mt-1 flex-shrink-0" />
                          {i < experiences.length - 1 && (
                            <div className="w-px flex-1 bg-slate-100 mt-1" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-medium text-slate-900">{jobTitle}</p>
                          <p className="text-xs text-violet-400">{company}</p>
                          <p className="text-xs text-slate-900/30 mt-0.5">{duration}</p>
                          {exp.responsibilities && (
                            <ul className="text-xs text-slate-500 list-disc ml-4 mt-1">
                              {Array.isArray(exp.responsibilities) 
                                ? exp.responsibilities.slice(0, 3).map((r: string, idx: number) => <li key={idx}>{r}</li>)
                                : <li>{exp.responsibilities}</li>
                              }
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button 
              onClick={() => navigate('/candidate/jobs')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-slate-900 font-medium text-sm transition-all"
            >
              Find Matching Jobs <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
