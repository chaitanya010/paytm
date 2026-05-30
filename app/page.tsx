'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSelector from '@/components/AppSelector'
import ScreenUploader from '@/components/ScreenUploader'
import ProgressStream from '@/components/ProgressStream'
import { AppId, Platform, TimeFilter, ScreenAnalysis } from '@/types'
import { APPS } from '@/lib/constants'

type Stage = 'select' | 'upload' | 'analyse' | 'error'

export default function HomePage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('select')
  const [errorReason, setErrorReason] = useState<string>('')
  const competitors: AppId[] = ['phonepe', 'gpay']
  const [focusArea, setFocusArea] = useState('all')
  const [platform, setPlatform] = useState<Platform>('both')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')
  const [screenAnalyses, setScreenAnalyses] = useState<ScreenAnalysis[]>([])

  const TIME_LABELS: Record<TimeFilter, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  }

  if (stage === 'select') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-4xl font-black text-white tracking-tight">ReviewSense</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                Beta
              </span>
            </div>
            <p className="text-lg text-gray-300 font-medium mb-1">
              Real-time competitive intelligence for Paytm PMs
            </p>
            <p className="text-gray-500 text-sm max-w-md">
              Scrape user reviews, detect pain points, surface competitor gaps — ship the right feature at the right time
            </p>
          </div>

          <AppSelector
            competitors={competitors}
            focusArea={focusArea}
            platform={platform}
            timeFilter={timeFilter}
            onToggleCompetitor={() => {}}
            onSelectFocus={setFocusArea}
            onSelectPlatform={setPlatform}
            onSelectTimeFilter={setTimeFilter}
          />

          <button
            onClick={() => { setScreenAnalyses([]); setStage('analyse') }}
            className="mt-8 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-colors"
          >
            Analyse Paytm vs PhonePe & GPay →
          </button>
        </div>

        <footer className="text-center py-4 text-xs text-gray-700 flex items-center justify-center gap-4">
          <span>Built for Paytm PMs · Powered by GPT-4o mini</span>
          <a href="/history" className="text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2">
            View history →
          </a>
        </footer>
      </div>
    )
  }

  if (stage === 'upload') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setStage('select')}
            className="text-gray-500 hover:text-gray-300 text-sm mb-6 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          <div className="mb-2 text-xs text-gray-600 font-medium uppercase tracking-wider">
            Step 2 of 3 — Add Paytm screenshots (optional)
          </div>

          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPS.paytm.color }} />
            <span className="text-white font-semibold">Paytm</span>
            {competitors.length > 0 && (
              <span className="text-gray-600 text-xs">
                + {competitors.map(c => APPS[c].name).join(', ')} (competitor)
              </span>
            )}
            <span className="text-gray-600 text-xs ml-auto">
              {platform === 'android' ? '🤖 Android' : platform === 'ios' ? '🍎 iOS' : '⊕ Both'} · {TIME_LABELS[timeFilter]}
            </span>
          </div>

          <ScreenUploader
            appName={APPS.paytm.name}
            platform={platform}
            onAnalysed={analyses => {
              setScreenAnalyses(analyses)
              setStage('analyse')
            }}
            onSkip={() => {
              setScreenAnalyses([])
              setStage('analyse')
            }}
          />
        </div>
      </div>
    )
  }

  if (stage === 'analyse') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-white font-bold text-xl mb-1">
              {competitors.length > 0
                ? `Competitive analysis: Paytm vs ${competitors.map(c => APPS[c].name).join(' & ')}`
                : 'Analysing Paytm'}
            </h2>
            <p className="text-gray-500 text-sm">
              {competitors.length > 0
                ? 'Scraping all apps, tagging reviews, generating competitive insights…'
                : 'Scraping reviews and identifying pain points…'}
              {' '}Don't close the tab.
            </p>
          </div>
          <ProgressStream
            appId="paytm"
            focusArea={focusArea}
            platform={platform}
            timeFilter={timeFilter}
            competitors={competitors}
            screenAnalyses={screenAnalyses}
            onComplete={slug => router.push(`/report/${slug}`)}
            onError={reason => { setErrorReason(reason ?? ''); setStage('error') }}
          />
        </div>
      </div>
    )
  }

  // error stage
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠</div>
        <h2 className="text-white font-bold text-lg mb-2">Analysis failed</h2>
        <p className="text-gray-500 text-sm mb-4">
          {errorReason && errorReason !== 'Cancelled by user'
            ? errorReason
            : 'Something went wrong. This may be due to rate limiting or a network issue.'}
        </p>
        {errorReason === 'rate_limited' && (
          <p className="text-amber-400 text-xs mb-4">
            Google Play Store is rate-limiting requests. Wait 5–10 minutes and try again, or switch to iOS-only platform.
          </p>
        )}
        {errorReason === 'no_reviews' && (
          <p className="text-amber-400 text-xs mb-4">
            No reviews found for this time window. Try selecting "This Month" or "All Time".
          </p>
        )}
        <button
          onClick={() => {
            setStage('select')
            setScreenAnalyses([])
          }}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
