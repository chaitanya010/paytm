'use client'
import { useState } from 'react'
import { Report } from '@/types'
import { APPS } from '@/lib/constants'
import PainPointCard from '@/components/PainPointCard'
import CompetitiveInsightPanel from '@/components/CompetitiveInsightPanel'

interface Props {
  report: Report
}

export default function ReportView({ report }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const generatedDate = new Date(report.generatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <a href="/" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">
                ReviewSense
              </a>
              <span className="text-gray-300">›</span>
              <span className="text-sm text-gray-600">{report.appName}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Generated {generatedDate} · {report.totalReviewsAnalysed} reviews · {report.painPoints.length} pain points
              {report.competitors?.length > 0 && ` · vs ${report.competitors.map(c => APPS[c as keyof typeof APPS]?.name ?? c).join(' & ')}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              {copied ? '✓ Copied!' : 'Share'}
            </button>
            <a
              href="/history"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            >
              History
            </a>
            <a
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white transition-colors"
            >
              New analysis
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {[
            { label: 'Reviews analysed', value: report.totalReviewsAnalysed.toLocaleString() },
            { label: 'Avg rating', value: `${report.avgRating} ★` },
            { label: 'Issues found', value: `${report.painPoints.length}` },
          ].map(card => (
            <div
              key={card.label}
              className="flex-shrink-0 bg-white rounded-xl border border-gray-200 px-5 py-4 min-w-[140px]"
            >
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Competitive intelligence section */}
        {report.competitiveInsights?.length > 0 && (
          <CompetitiveInsightPanel
            competitorSentiments={report.competitorSentiments ?? []}
            competitiveInsights={report.competitiveInsights}
            timeFilter={report.timeFilter ?? 'all'}
            paytmAvgRating={report.avgRating}
            paytmTotalReviews={report.totalReviewsScraped}
            paytmSentiment={report.paytmSentiment}
          />
        )}

        {/* Pain points */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">
              Paytm pain points — {report.painPoints.length} categories
            </h2>
            {report.timeFilter && report.timeFilter !== 'all' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                {{today:'Today',week:'This Week',month:'This Month',all:'All Time'}[report.timeFilter]}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Ranked by frequency × severity · {report.totalReviewsAnalysed} reviews analysed
          </p>
        </div>

        <div className="space-y-4">
          {report.painPoints.map((pp, i) => (
            <PainPointCard
              key={pp.category}
              painPoint={pp}
              rank={i + 1}
              appId={report.appId}
              screenAnalyses={[]}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Report expires {new Date(report.expiresAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })} · Generate a new one anytime
          </p>
          <p className="text-xs text-gray-400">
            Reviews scraped from Google Play Store and Apple App Store · Classified and analysed using Claude AI
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Disclaimer: AI-classified reviews. Validate findings with user research before acting.
          </p>
        </div>
      </div>

    </div>
  )
}
