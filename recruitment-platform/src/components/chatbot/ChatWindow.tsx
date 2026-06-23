import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, Copy, ThumbsUp, RotateCcw } from 'lucide-react'
import type { ChatMessage, ChatSession } from '../../types'
import { CandidateCard } from '../shared/CandidateCard'
import { cn } from '../../lib/utils'
import { VoiceInput } from '../../pages/shared/VoiceInput'; // Adjust the relative steps to reach your shared components folder

const suggestedPrompts = {
  recruiter: [
    'Show me the best matching candidates for this position',
    'Analyze the top candidate\'s strengths and weaknesses',
    'Generate a personalized email for the top candidate',
    'Compare the top 3 candidates for the ML Engineer role',
    'Which candidates have Python and Kubernetes skills?',
  ],
  candidate: [
    'What jobs match my profile best?',
    'How can I improve my CV for tech roles?',
    'What skills should I add to increase my match score?',
    'Review my experience section',
    'Help me write a cover letter for this role',
  ],
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        <Sparkles size={14} className="text-slate-900" />
      </div>
      <div className="bg-white/8 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-violet-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-slate-900">{line.slice(2, -2)}</p>
      }
      // Bold inline
      const boldParts = line.split(/\*\*(.*?)\*\*/g)
      if (boldParts.length > 1) {
        return (
          <p key={i} className="leading-relaxed">
            {boldParts.map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="text-slate-900 font-semibold">{part}</strong> : part
            )}
          </p>
        )
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc leading-relaxed">{line.slice(2)}</li>
      }
      if (line === '') return <div key={i} className="h-2" />
      return <p key={i} className="leading-relaxed">{line}</p>
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-end gap-3 group', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-slate-100 border border-slate-300'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600'
      )}>
        {isUser
          ? <User size={14} className="text-slate-900/60" />
          : <Sparkles size={14} className="text-slate-900" />
        }
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[80%] space-y-3', isUser && 'items-end flex flex-col')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm',
          isUser
            ? 'bg-violet-500 text-slate-900 rounded-br-sm'
            : 'bg-white/8 border border-slate-200 text-slate-900/80 rounded-bl-sm'
        )}>
          <div className="space-y-1">{renderContent(message.content)}</div>
        </div>

        {/* Candidate cards attached to message */}
        {message.candidateCards && message.candidateCards.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            {message.candidateCards.map(c => (
              <CandidateCard key={c.id} candidate={c} score={97} compact />
            ))}
          </div>
        )}

        {/* Email preview */}
        {message.emailPreview && (
          <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900/60 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-violet-400 font-medium">📧 Email Preview</p>
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">{message.emailPreview}</pre>
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-900/30 hover:text-slate-900/60 transition-all">
              {copied ? <ThumbsUp size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-900/30 hover:text-slate-900/60 transition-all">
              <RotateCcw size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface ChatWindowProps {
  session: ChatSession
  onSendMessage: (content: string) => void
  isTyping?: boolean
  context?: 'candidate' | 'recruiter'
  language?: 'en' | 'fr' // ➕ Ajoute cette ligne
}

export function ChatWindow({ session, onSendMessage, isTyping, context = 'recruiter',language = 'fr' }: ChatWindowProps) {
  const [input, setInput] = useState('')

const handleVoiceTranscript = (spokenText: string) => {
  setInput(spokenText); // This seamlessly drops the browser's transcribed text right into the chat input bar!
};


  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages, isTyping])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
    }
  }

  const prompts = suggestedPrompts[context]

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center ai-glow">
              <Sparkles size={28} className="text-slate-900" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 text-lg">RecruitAI Assistant</h3>
              <p className="text-sm text-slate-900/40 mt-1">Ask me anything about candidates, jobs, or recruitment</p>
            </div>
            <div className="grid gap-2 w-full max-w-lg">
              {prompts.map(p => (
                <button
                  key={p}
                  onClick={() => onSendMessage(p)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-violet-500/30 text-slate-900/60 hover:text-slate-900/80 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {session.messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
          </>
        )}
        <div ref={bottomRef} />
      </div>

     {/* Input */}
      <div className="border-t border-slate-200 p-4">
        <div className="relative flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-violet-500/50 transition-colors">
          
          {/* 🎤 DROP THE MIC COMPONENT BUTTON RIGHT HERE */}
          <div className="mb-0.5">
            <VoiceInput onTranscriptComplete={handleVoiceTranscript} currentLang={language} />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask the AI assistant…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900/80 placeholder-white/30 resize-none focus:outline-none leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            <Send size={14} className="text-slate-900" />
          </button>
        </div>
        <p className="text-[10px] text-slate-900/20 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
