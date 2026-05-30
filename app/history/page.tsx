import { listReports, listReportsMem } from '@/lib/cache'
import { APPS, CATEGORY_META } from '@/lib/constants'
import { Report } from '@/types'
import Link from 'next/link'

export const revalidate = 0  // always fresh

async function getHistory(): Promise<Report[]> {
  const fromDb = await listReports(100)
  if (fromDb.length > 0) return fromDb
  return listReportsMem()
}

export default async function HistoryPage() {
  const reports = await getHistory()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Nav */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-sm hover:text-blue-400 transition-colors">
            ← ReviewSense
          </Link>
          <Link
            href="/"
            className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            New analysis
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Report History</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {reports.length} report{reports.length !== 1 ? 's' : ''} stored · click any to view full analysis
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-400 text-lg font-medium">No reports yet</p>
            <p className="text-gray-600 text-sm mt-2">Generate your first analysis to see it here</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Generate a report
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <ReportRow key={r.slug} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportRow({ report: r }: { report: Report }) {
  const app = APPS[r.appId]
  const topPP = r.painPoints[0]
  const topMeta = topPP ? CATEGORY_META[topPP.category] : null
  const date = new Date(r.generatedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const time = new Date(r.generatedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <Link
      href={`/report/${r.slug}`}
      className="block bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-600 hover:bg-gray-800 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: app + metadata */}
        <div className="flex items-center gap-4 min-w-0">
          {/* App colour dot */}
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black text-sm"
            style={{ background: app?.color ?? '#374151' }}
          >
            {r.appName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">{r.appName}</span>
              {r.hasScreenshots && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                  Screenshots
                </span>
              )}
              {r.focusArea && r.focusArea !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
                  {r.focusArea.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-gray-500 text-xs">{date} · {time}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{r.totalReviewsAnalysed} reviews</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{r.avgRating} ★</span>
            </div>
          </div>
        </div>

        {/* Right: top pain point + slug */}
        <div className="flex-shrink-0 text-right">
          {topMeta && (
            <span
              className="inline-block text-xs px-2 py-1 rounded-full font-medium mb-1"
              style={{ background: topMeta.bg, color: topMeta.color }}
            >
              #{1} {topMeta.label}
            </span>
          )}
          <p className="text-gray-600 text-xs font-mono">/{r.slug}</p>
          <p className="text-gray-500 text-xs mt-0.5">{r.painPoints.length} pain points →</p>
        </div>
      </div>

      {/* Pain point preview chips */}
      {r.painPoints.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {r.painPoints.slice(0, 4).map((pp, i) => {
            const meta = CATEGORY_META[pp.category]
            return (
              <span
                key={pp.category}
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{
                  color: meta?.color ?? '#9CA3AF',
                  borderColor: `${meta?.color ?? '#374151'}40`,
                  background: `${meta?.color ?? '#374151'}10`,
                }}
              >
                #{i + 1} {meta?.label ?? pp.category}
              </span>
            )
          })}
        </div>
      )}
    </Link>
  )
}
