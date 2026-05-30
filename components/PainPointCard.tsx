'use client'
import { PainPoint } from '@/types'
import { CATEGORY_META } from '@/lib/constants'

interface Props {
  painPoint: PainPoint
  rank: number
  appId: string
  screenAnalyses: any[]
}

export default function PainPointCard({ painPoint, rank }: Props) {
  const meta = CATEGORY_META[painPoint.category] ?? CATEGORY_META.other
  const severityColor =
    painPoint.avgSeverity >= 4 ? '#DC2626' :
    painPoint.avgSeverity >= 3 ? '#D97706' : '#9CA3AF'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start gap-4">
        <span className="text-5xl font-black text-gray-100 leading-none select-none flex-shrink-0 mt-1">
          #{rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ color: meta.color, backgroundColor: meta.bg }}
            >
              {meta.label}
            </span>
            {painPoint.isIndustryWide && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Industry-wide
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-3">
            {painPoint.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="font-medium">{painPoint.frequency} reviews</span>
            <span>Severity {painPoint.avgSeverity}/5</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(dot => (
                <span
                  key={dot}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: dot <= Math.round(painPoint.avgSeverity)
                      ? severityColor : '#E5E7EB',
                  }}
                />
              ))}
            </div>
          </div>

          {painPoint.topVerbatims.length > 0 && (
            <div className="space-y-2">
              {painPoint.topVerbatims.slice(0, 3).map((v, i) => (
                <blockquote
                  key={i}
                  className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 italic border-l-2 border-gray-200"
                >
                  <span className="text-gray-300 mr-1 not-italic">"</span>
                  {v.length > 120 ? v.slice(0, 120) + '…' : v}
                </blockquote>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
