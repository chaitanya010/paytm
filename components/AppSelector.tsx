'use client'
import { AppId, Platform, TimeFilter } from '@/types'
import { APPS, FOCUS_AREAS } from '@/lib/constants'

interface Props {
  competitors: AppId[]
  focusArea: string
  platform: Platform
  timeFilter: TimeFilter
  onToggleCompetitor: (id: AppId) => void
  onSelectFocus: (f: string) => void
  onSelectPlatform: (p: Platform) => void
  onSelectTimeFilter: (t: TimeFilter) => void
}

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'android', label: '🤖 Android' },
  { value: 'ios', label: '🍎 iOS' },
  { value: 'both', label: '⊕ Both' },
]

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

const COMPETITORS: AppId[] = ['phonepe', 'gpay']

export default function AppSelector({
  competitors,
  focusArea,
  platform,
  timeFilter,
  onToggleCompetitor,
  onSelectFocus,
  onSelectPlatform,
  onSelectTimeFilter,
}: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">

      {/* Primary app — always Paytm */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Primary App
        </p>
        <div
          className="flex items-center gap-3 p-4 rounded-xl border-2 bg-[#0D1B2A]"
          style={{ borderColor: APPS.paytm.color }}
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: APPS.paytm.color }} />
          <div className="flex-1">
            <p className="text-white font-semibold">{APPS.paytm.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{APPS.paytm.description}</p>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: APPS.paytm.color }}
          >
            Your App
          </span>
        </div>
      </div>

      {/* Competitors — always PhonePe + GPay */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Competitors (always included)
        </p>
        <p className="text-xs text-gray-600 mb-3">
          Their reviews will be analysed to surface Paytm opportunities and gaps
        </p>
        <div className="grid grid-cols-2 gap-3">
          {COMPETITORS.map(cid => {
            const app = APPS[cid]
            return (
              <div
                key={cid}
                className="text-left p-4 rounded-xl border-2"
                style={{
                  borderColor: app.color,
                  backgroundColor: `${app.color}12`,
                  boxShadow: `0 0 16px ${app.color}22`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: app.color }} />
                  <span className="font-semibold text-sm text-gray-200">{app.name}</span>
                  <span
                    className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: app.color }}
                  >
                    ✓
                  </span>
                </div>
                <p className="text-xs text-gray-500">{app.description}</p>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
          <span>✦</span>
          Competitive intelligence mode — insights will be framed around what Paytm should build
        </p>
      </div>

      {/* Time filter */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Review time window
        </p>
        <div className="flex gap-2">
          {TIME_FILTERS.map(tf => (
            <button
              key={tf.value}
              onClick={() => onSelectTimeFilter(tf.value)}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                timeFilter === tf.value
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform + focus area */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Platform
          </p>
          <div className="flex flex-col gap-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                onClick={() => onSelectPlatform(p.value)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors text-left ${
                  platform === p.value
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Focus area
          </p>
          <select
            value={focusArea}
            onChange={e => onSelectFocus(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 text-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FOCUS_AREAS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  )
}
