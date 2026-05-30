'use client'
import { useState } from 'react'
import { CompetitiveInsight, CompetitorSentiment, SentimentBreakdown } from '@/types'
import { APPS } from '@/lib/constants'

const INSIGHT_META: Record<CompetitiveInsight['type'], {
  label: string; color: string; bg: string; border: string; icon: string
}> = {
  paytm_critical:       { label: 'Paytm Critical',       color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: '🔴' },
  competitor_advantage: { label: 'Competitor Advantage',  color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '🟡' },
  industry_wide:        { label: 'Industry-Wide',         color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', icon: '🟣' },
  paytm_strength:       { label: 'Paytm Strength',        color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: '🟢' },
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

const TIME_LABELS: Record<string, string> = {
  today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time',
}

// ── Sentiment bar ─────────────────────────────────────────────────────────────

function SentimentBar({ breakdown, patterns }: { breakdown: SentimentBreakdown; patterns: string[] }) {
  return (
    <div className="mt-3">
      {/* Bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {breakdown.positive > 0 && (
          <div className="bg-emerald-500 rounded-l-full" style={{ width: `${breakdown.positive}%` }} />
        )}
        {breakdown.neutral > 0 && (
          <div className="bg-gray-300" style={{ width: `${breakdown.neutral}%` }} />
        )}
        {breakdown.negative > 0 && (
          <div className="bg-red-400 rounded-r-full" style={{ width: `${breakdown.negative}%` }} />
        )}
      </div>
      {/* Labels */}
      <div className="flex gap-3 mt-1.5 flex-wrap">
        {breakdown.positive > 0 && (
          <span className="text-xs text-emerald-600 font-medium">+{breakdown.positive}% positive</span>
        )}
        {breakdown.negative > 0 && (
          <span className="text-xs text-red-500 font-medium">{breakdown.negative}% negative</span>
        )}
        {breakdown.neutral > 0 && (
          <span className="text-xs text-gray-400">{breakdown.neutral}% neutral</span>
        )}
      </div>
      {/* Patterns */}
      {patterns.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {patterns.map((p, i) => (
            <li key={i} className="text-xs text-gray-500">· {p}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: CompetitiveInsight; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const meta = INSIGHT_META[insight.type]
  const hasStructured = insight.evidence || insight.rootCauseHypothesis || insight.competitorBenchmark

  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: meta.bg, borderColor: meta.border }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <span className="text-base">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: meta.color }}>
              {meta.label}
            </span>
            <span className={`text-xs font-semibold capitalize ${
              insight.priority === 'high' ? 'text-red-600' :
              insight.priority === 'medium' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {insight.priority} priority
            </span>
            {insight.priorityScore != null && (
              <span className="text-xs text-gray-400 font-mono">score {insight.priorityScore}</span>
            )}
            {insight.confidenceScore != null && (
              <span className="text-xs text-gray-400">
                {Math.round(insight.confidenceScore * 100)}% confidence
              </span>
            )}
            {(insight.relatedApps?.length ?? 0) > 0 && (
              <span className="text-xs text-gray-400 ml-auto">
                {insight.relatedApps.map(id => APPS[id as keyof typeof APPS]?.name ?? id).join(' · ')}
              </span>
            )}
          </div>

          {/* Title + detail */}
          <h3 className="font-bold text-gray-900 text-sm mb-1">{insight.title}</h3>
          <p className="text-xs text-gray-600 mb-2">{insight.detail}</p>

          {/* Frequency + severity badge */}
          {(insight.frequency || insight.severity) && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {insight.frequency && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 text-gray-700">
                  📊 {insight.frequency}
                </span>
              )}
              {insight.severity && (
                <span className={`text-xs px-2 py-0.5 rounded-full bg-white/70 border border-gray-200 font-medium ${
                  insight.severity >= 4 ? 'text-red-600' :
                  insight.severity === 3 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  Severity {insight.severity}/5
                </span>
              )}
            </div>
          )}

          {/* Suggested action */}
          <div className="bg-white/70 rounded-lg px-3 py-2 border border-white/50 mb-2">
            <p className="text-xs font-semibold text-gray-700 mb-0.5">Suggested action</p>
            <p className="text-xs text-gray-600">{insight.suggestedAction}</p>
          </div>

          {/* Expandable structured details */}
          {hasStructured && (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-800"
              >
                {expanded ? '▲ Hide details' : '▼ Show full intelligence brief'}
              </button>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {insight.evidence && (
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Evidence</p>
                      <p className="text-xs text-gray-700 italic">"{insight.evidence}"</p>
                    </div>
                  )}
                  {insight.rootCauseHypothesis && (
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Root Cause Hypothesis</p>
                      <p className="text-xs text-gray-700">{insight.rootCauseHypothesis}</p>
                    </div>
                  )}
                  {insight.competitorBenchmark && (
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Competitor Benchmark</p>
                      <p className="text-xs text-gray-700">{insight.competitorBenchmark}</p>
                    </div>
                  )}
                  {insight.recommendedAction && insight.recommendedAction !== insight.suggestedAction && (
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Action (WHAT · WHERE · HOW)</p>
                      <p className="text-xs text-gray-700">{insight.recommendedAction}</p>
                    </div>
                  )}
                  {insight.expectedMetricImpact && (
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Expected Metric Impact</p>
                      <p className="text-xs text-gray-700">{insight.expectedMetricImpact}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  competitorSentiments: CompetitorSentiment[]
  competitiveInsights: CompetitiveInsight[]
  timeFilter: string
  paytmAvgRating: number
  paytmTotalReviews: number
  paytmSentiment?: {
    sentimentBreakdown: SentimentBreakdown
    reviewPatterns: string[]
  }
}

export default function CompetitiveInsightPanel({
  competitorSentiments,
  competitiveInsights,
  timeFilter,
  paytmAvgRating,
  paytmTotalReviews,
  paytmSentiment,
}: Props) {
  const sorted = [...competitiveInsights].sort(
    (a, b) => {
      // Sort by priorityScore if available, else priority label
      if (a.priorityScore != null && b.priorityScore != null) return b.priorityScore - a.priorityScore
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    }
  )

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-xl font-bold text-gray-900">Competitive Intelligence</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          {TIME_LABELS[timeFilter] ?? timeFilter}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Paytm vs {competitorSentiments.map(cs => cs.appName).join(' & ')} — evidence-backed insights for Paytm's roadmap
      </p>

      {/* App sentiment comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Paytm */}
        <div className="rounded-xl border-2 p-4" style={{ borderColor: APPS.paytm.color }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: APPS.paytm.color }} />
            <span className="font-bold text-gray-900">Paytm</span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: APPS.paytm.color }}>
              Your App
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900">{paytmAvgRating} ★</p>
          <p className="text-xs text-gray-500 mt-0.5">{paytmTotalReviews.toLocaleString()} reviews scraped</p>
          {paytmSentiment && (
            <SentimentBar
              breakdown={paytmSentiment.sentimentBreakdown}
              patterns={paytmSentiment.reviewPatterns}
            />
          )}
        </div>

        {competitorSentiments.map(cs => (
          <div key={cs.appId} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cs.color }} />
              <span className="font-bold text-gray-900">{cs.appName}</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{cs.avgRating} ★</p>
            <p className="text-xs text-gray-500 mt-0.5">{cs.totalReviews.toLocaleString()} reviews scraped</p>
            <div className="mt-2 space-y-0.5">
              {cs.topCategories.slice(0, 3).map(c => (
                <p key={c.category} className="text-xs text-gray-500 truncate">· {c.title}</p>
              ))}
            </div>
            <SentimentBar
              breakdown={cs.sentimentBreakdown}
              patterns={cs.reviewPatterns}
            />
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {sorted.map((insight, i) => (
          <InsightCard key={i} insight={insight} index={i} />
        ))}
      </div>
    </div>
  )
}
