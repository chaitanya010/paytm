'use client'
import { useEffect, useState, useRef } from 'react'
import { AppId, Platform, TimeFilter } from '@/types'
import { APPS } from '@/lib/constants'

interface Props {
  appId: string
  focusArea: string
  platform: Platform
  timeFilter: TimeFilter
  competitors: AppId[]
  screenAnalyses: any[]
  onComplete: (slug: string) => void
  onError: (reason?: string) => void
}

function buildSteps(platform: Platform, competitors: AppId[], timeFilter: TimeFilter): string[] {
  const allApps: AppId[] = ['paytm', ...competitors]
  const scrapeSteps: string[] = []

  for (const appId of allApps) {
    const name = APPS[appId].name
    if (platform !== 'ios') scrapeSteps.push(`Scraping ${name} Play Store`)
    if (platform !== 'android') scrapeSteps.push(`Scraping ${name} App Store`)
  }

  const tail = [
    ...(timeFilter !== 'all' ? ['Applying time filter'] : []),
    'Filtering relevant reviews',
    'Tagging reviews with AI',
    'Identifying pain points',
    ...(competitors.length > 0 ? ['Running competitive analysis'] : []),
    'Saving report',
  ]

  return [...scrapeSteps, ...tail]
}

type StepStatus = 'pending' | 'running' | 'done' | 'error'

interface StepState {
  status: StepStatus
  detail: string
}

export default function ProgressStream({
  appId, focusArea, platform, timeFilter, competitors, screenAnalyses, onComplete, onError,
}: Props) {
  const STEPS = buildSteps(platform, competitors, timeFilter)

  const [steps, setSteps] = useState<Record<string, StepState>>(
    Object.fromEntries(STEPS.map(s => [s, { status: 'pending', detail: '' }]))
  )
  const [cancelled, setCancelled] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const doneCount = Object.values(steps).filter(s => s.status === 'done').length
  const progress = Math.round((doneCount / STEPS.length) * 100)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller

    async function run() {
      try {
        const res = await fetch('/api/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId, focusArea, platform, timeFilter, competitors, screenAnalyses }),
          signal: controller.signal,
        })

        if (!res.body) throw new Error('No stream body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              const { step, status, detail, slug } = event

              if (step === 'COMPLETE') {
                if (status === 'done' && slug) onComplete(slug)
                else onError(detail)
                return
              }

              if (step === 'Error') {
                onError(detail)
                return
              }

              setSteps(prev => ({
                ...prev,
                [step]: { status, detail: detail ?? '' },
              }))
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[ProgressStream]', err)
          onError(err?.message)
        }
      }
    }

    run()
    return () => controller.abort()
  }, [appId, focusArea, platform, timeFilter, competitors.join(',')])

  const handleCancel = () => {
    abortRef.current?.abort()
    setCancelled(true)
    setTimeout(() => onError('Cancelled by user'), 300)
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="h-1 bg-gray-800">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 space-y-3">
        {STEPS.map(step => {
          const { status, detail } = steps[step] ?? { status: 'pending', detail: '' }
          return (
            <div key={step} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {status === 'pending' && <span className="w-4 h-4 rounded-full bg-gray-700 block" />}
                {status === 'running' && (
                  <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin block" />
                )}
                {status === 'done' && (
                  <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center block text-white text-xs">✓</span>
                )}
                {status === 'error' && (
                  <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center block text-white text-xs">✕</span>
                )}
              </div>
              <div>
                <p className={`text-sm ${
                  status === 'running' ? 'text-white font-medium' :
                  status === 'done' ? 'text-gray-400' :
                  status === 'error' ? 'text-red-400' :
                  'text-gray-600'
                }`}>
                  {step}
                </p>
                {detail && (status === 'running' || status === 'error') && (
                  <p className={`text-xs mt-0.5 ${status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                    {detail}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!cancelled && (
        <div className="px-6 pb-5">
          <button onClick={handleCancel} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Cancel analysis
          </button>
        </div>
      )}
    </div>
  )
}
