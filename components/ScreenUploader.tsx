'use client'
import { useState, useCallback, useRef } from 'react'
import { Platform } from '@/types'

interface Props {
  appName: string
  platform: Platform
  onAnalysed: (analyses: any[]) => void
  onSkip: () => void
}

const MAX_SIZE = 5 * 1024 * 1024
const MAX_FILES = 10

const SCREEN_HINTS: Record<Platform, string[]> = {
  android: ['Home screen (recharge entry)', 'Plan selection screen', 'Payment confirmation', 'Success / failure screen'],
  ios: ['App home screen', 'Recharge / top-up flow', 'Payment sheet', 'Order confirmation screen'],
  both: ['Home screen (recharge entry)', 'Plan selection screen', 'Payment confirmation', 'Success / failure screen'],
}

export default function ScreenUploader({ appName, platform, onAnalysed, onSkip }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid: File[] = []
    let errMsg: string | null = null
    Array.from(incoming).forEach(f => {
      if (!f.type.startsWith('image/')) return
      if (f.size > MAX_SIZE) {
        errMsg = `"${f.name}" exceeds 5 MB limit`
        return
      }
      valid.push(f)
    })
    if (errMsg) setError(errMsg)
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAnalyse = async () => {
    if (!files.length) return
    setAnalysing(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('appName', appName)
      files.forEach(f => fd.append('screenshots', f))
      const res = await fetch('/api/analyse-screens', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDone(true)
      onAnalysed(data.analyses ?? [])
    } catch (err: any) {
      setError(err.message ?? 'Analysis failed')
      setAnalysing(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-green-400 font-medium">Screenshots analysed successfully</p>
        <p className="text-gray-500 text-sm mt-1">Proceeding to review analysis...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-blue-400 bg-blue-900/10' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
        <div className="text-4xl mb-3">☁</div>
        <p className="text-gray-300 font-medium">Drop screenshots here</p>
        <p className="text-gray-500 text-sm mt-1">
          Upload {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'app'} screenshots of the recharge flow for accurate mockups
        </p>
        <p className="text-gray-600 text-xs mt-2">PNG, JPEG, WebP · Max 5 MB each · Up to 10 files</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setShowHints(h => !h) }}
        className="mt-3 text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
      >
        <span>{showHints ? '▾' : '▸'}</span> Suggested screens to upload
      </button>
      {showHints && (
        <ul className="mt-2 ml-4 space-y-1 text-xs text-gray-500 list-disc">
          {SCREEN_HINTS[platform].map(hint => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="w-full h-16 object-cover rounded-lg border border-gray-700"
              />
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              <p className="text-gray-600 text-xs mt-1 truncate">{f.name}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 text-red-400 text-sm">{error}</p>
      )}

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAnalyse}
          disabled={!files.length || analysing}
          className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {analysing ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Claude is reading your screenshots...
            </>
          ) : (
            `Analyse Screenshots (${files.length})`
          )}
        </button>
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 px-4 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 text-sm transition-colors"
        >
          Skip — use AI knowledge only
        </button>
      </div>
      {files.length === 0 && (
        <p className="mt-2 text-center text-xs text-gray-600">
          Skipping will generate approximate mockups based on AI knowledge
        </p>
      )}
    </div>
  )
}
