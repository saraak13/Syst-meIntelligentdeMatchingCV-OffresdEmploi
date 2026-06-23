import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle, Volume2, VolumeX, Languages } from 'lucide-react'
import { ChatWindow } from '../../components/chatbot/ChatWindow'
import { useAuth } from '../../contexts/AuthContext'
import type { ChatSession, ChatMessage } from '../../types'

interface ChatbotPageProps {
  context: 'candidate' | 'recruiter'
}

interface RecruiterJob {
  id: string
  title: string
}

export function ChatbotPage({ context }: ChatbotPageProps) {
  const { user } = useAuth()
  const [session, setSession] = useState<ChatSession>({
    id: 'new',
    title: 'RecruitAI Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    context,
    messages: [],
  })
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recruiterJobs, setRecruiterJobs] = useState<RecruiterJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false)
  
  const [isMuted, setIsMuted] = useState(true)
  // 🌐 Nouvel état pour gérer la langue globale du chatbot ('fr' ou 'en')
  const [language, setLanguage] = useState<'en' | 'fr'>('fr') 

  useEffect(() => {
    if (!user) return

    const fetchJobs = async () => {
      try {
        const url = context === 'recruiter' 
          ? `/api/jobs/recruiter/${user.id}` 
          : `/api/jobs`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setRecruiterJobs(data)
          
          const params = new URLSearchParams(window.location.search)
          const targetJobId = params.get('jobId')
          const autoPrompt = params.get('autoPrompt')

          if (targetJobId) {
            const matchedJob = data.find((job: any) => job.id === targetJobId)
            if (matchedJob) {
              setSelectedJobId(targetJobId)
              
              if (autoPrompt === 'true' && !hasAutoPrompted) {
                setHasAutoPrompted(true)
                const promptMsg = language === 'fr' 
                  ? `Comment puis-je adapter et optimiser mon CV pour l'offre d'emploi "${matchedJob.title}" ?`
                  : `How can I adapt and optimize my CV for the job offer "${matchedJob.title}"?`
                
                setTimeout(() => {
                  handleSendMessage(promptMsg)
                }, 300)
              }
            }
          } else if (data.length > 0) {
            setSelectedJobId(data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load jobs:', err)
      }
    }

    fetchJobs()
  }, [user, context, language, hasAutoPrompted])

  const speakText = (text: string) => {
    window.speechSynthesis.cancel()
    if (isMuted) return

    const cleanText = text.replace(/\*/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // 🎙️ Adapte la voix du haut-parleur selon la langue choisie
    utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    window.speechSynthesis.speak(utterance)
  }

  const handleSendMessage = async (content: string) => {
    if (!user) return

    window.speechSynthesis.cancel()

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setSession(s => ({ ...s, messages: [...s.messages, newMsg] }))
    setIsTyping(true)
    setError(null)

    try {
      const body: Record<string, string> = {
        user_id: user.id,
        message: content,
        context,
        // 💡 On passe la langue au backend pour forcer l'IA à répondre dans la bonne langue !
        language: language 
      }
      if (selectedJobId) {
        body.job_id = selectedJobId
      }

      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const detail = err.detail
        const message = Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
          : typeof detail === 'string'
            ? detail
            : response.status === 404
              ? 'Chatbot API not found — restart the backend'
              : 'Failed to get AI response'
        throw new Error(message)
      }

      const data = await response.json()
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
      }

      speakText(data.reply)

      setSession(s => ({
        ...s,
        id: data.session_id || s.id,
        messages: [...s.messages, assistantMsg],
        updatedAt: new Date().toISOString(),
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Container */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl ai-glow flex items-center justify-center">
            <Sparkles size={18} className="text-slate-900" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-left">RecruitAI Assistant</h2>
            <p className="text-xs text-slate-900/50 text-left">
              {context === 'recruiter'
                ? 'Candidate matching & analysis — powered by your live data'
                : 'Career & job match advisor — powered by your CV & matches'}
            </p>
          </div>
        </div>

        {/* Right side controls (Language Selection + Toggle Volume + Select Menu) */}
        <div className="flex items-center gap-2">
          
          {/* 🌐 Sélecteur de Langue */}
          <button
            type="button"
            onClick={() => setLanguage(l => l === 'fr' ? 'en' : 'fr')}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 font-medium transition-all"
            title="Changer la langue / Change Language"
          >
            <Languages size={14} className="text-violet-500" />
            <span>{language === 'fr' ? 'Français' : 'English'}</span>
          </button>

          {/* 🎛️ Bouton Volume */}
          <button
            type="button"
            onClick={() => {
              const nextMuteState = !isMuted
              setIsMuted(nextMuteState)
              if (nextMuteState) window.speechSynthesis.cancel()
            }}
            className={`px-3 py-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-medium ${
              !isMuted 
                ? 'bg-violet-500 border-violet-600 text-slate-900 shadow-md' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {!isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{!isMuted ? (language === 'fr' ? 'Voix On' : 'Voice On') : (language === 'fr' ? 'Voix Off' : 'Voice Off')}</span>
          </button>

          {recruiterJobs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium hidden md:inline">
                {context === 'recruiter' ? 'Selected Job:' : 'Target Job Offer:'}
              </span>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-violet-500/50 max-w-[200px] truncate"
              >
                {recruiterJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 relative z-10">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden relative z-10">
        <ChatWindow
          session={session}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          context={context}
          language={language} // 💡 On envoie la langue courante à la fenêtre de chat
        />
      </div>
    </div>
  )
}