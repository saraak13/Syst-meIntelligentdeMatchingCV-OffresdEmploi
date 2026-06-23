import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UploadDropzoneProps {
  onUpload: (file: File) => void
  accept?: string
  label?: string
}

export function UploadDropzone({ onUpload, accept = '.pdf', label = 'Upload your CV' }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploaded, setUploaded] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = useCallback(
    (file: File) => {
      setUploading(true)
      setProgress(0)
      let p = 0
      const interval = setInterval(() => {
        p += Math.random() * 25
        if (p >= 100) {
          p = 100
          clearInterval(interval)
          setUploading(false)
          setUploaded(file)
          onUpload(file)
        }
        setProgress(Math.min(p, 100))
      }, 200)
    },
    [onUpload]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200',
        dragging
          ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
          : uploaded
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-300 bg-white/3 hover:border-violet-500/50 hover:bg-violet-500/5'
      )}
    >
      <input
        id="cv-upload"
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <AnimatePresence mode="wait">
        {uploaded ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <CheckCircle size={40} className="text-emerald-400" />
            <p className="font-semibold text-emerald-400">CV Uploaded Successfully!</p>
            <div className="flex items-center gap-2 text-sm text-slate-900/60 bg-slate-100 rounded-xl px-4 py-2">
              <File size={16} />
              {uploaded.name}
              <button
                onClick={e => { e.preventDefault(); setUploaded(null) }}
                className="ml-2 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : uploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <p className="text-sm text-slate-900/60">Parsing CV with AI...</p>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2">
              <motion.div
                className="bg-violet-500 h-2 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-900/40">{Math.round(progress)}%</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: dragging ? -6 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Upload size={40} className="text-slate-900/30" />
            </motion.div>
            <div>
              <p className="font-semibold text-slate-900/80">{label}</p>
              <p className="text-sm text-slate-900/40 mt-1">Drag & drop or click to browse</p>
              <p className="text-xs text-slate-900/30 mt-0.5">PDF, DOC, DOCX up to 10MB</p>
            </div>
            <label
              htmlFor="cv-upload"
              className="mt-2 px-5 py-2 bg-violet-500 hover:bg-violet-600 text-slate-900 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Choose File
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
