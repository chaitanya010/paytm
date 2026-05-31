import { RawReview, AppId, TimeFilter } from '@/types'
import { APPS } from './constants'

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export function getDateCutoff(filter: TimeFilter): Date | null {
  const now = new Date()
  switch (filter) {
    case 'today': {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      return d
    }
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d
    }
    case 'all':
    default:
      return null
  }
}

export function applyTimeFilter(reviews: RawReview[], filter: TimeFilter): RawReview[] {
  const cutoff = getDateCutoff(filter)
  if (!cutoff) return reviews
  return reviews.filter(r => new Date(r.date) >= cutoff)
}

export async function scrapePlayStore(
  appId: AppId,
  count = 300
): Promise<RawReview[]> {
  const app = APPS[appId]
  try {
    // google-play-scraper is pure ESM — must use dynamic import, not require()
    const gplay = (await import('google-play-scraper')).default
    const raw = await gplay.reviews({
      appId: app.playStoreId,
      sort: 2, // sort.NEWEST = 2
      num: count,
      lang: 'en',
      country: 'in',
      throttle: 10,
    })
    const list: any[] = Array.isArray(raw) ? raw : ((raw as any).data ?? [])
    return list.map((r: any, i: number) => ({
      id: `ps_${appId}_${i}_${Date.now()}`,
      text: r.text ?? r.body ?? '',
      rating: r.score ?? r.rating ?? 3,
      date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      store: 'playstore' as const,
      thumbsUp: r.thumbsUp ?? 0,
    })).filter((r: RawReview) => r.text && r.text.length > 20)
  } catch (err) {
    console.error(`[scraper] PlayStore failed for ${appId}:`, err)
    return []
  }
}

// Uses Apple's official public iTunes RSS JSON API — no npm library, no scraping.
// Falls back across countries: India first, then US and GB for apps not listed in India.
const AS_COUNTRIES = ['in', 'us', 'gb']

export async function scrapeAppStore(
  appId: AppId,
  pages = 5
): Promise<RawReview[]> {
  const app = APPS[appId]
  const seen = new Set<string>()
  const all: RawReview[] = []

  for (const country of AS_COUNTRIES) {
    const countryResults = await scrapeAppStoreCountryRSS(app.appStoreId, appId, country, pages)
    for (const r of countryResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        all.push(r)
      }
    }
    if (all.length >= 100) break
    await sleep(300)
  }

  return all
}

async function scrapeAppStoreCountryRSS(
  appStoreId: string,
  appId: AppId,
  country: string,
  pages: number
): Promise<RawReview[]> {
  const results: RawReview[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url =
        `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appStoreId}/sortBy=mostRecent/json`

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'application/json',
        },
        // 10 s timeout
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        console.warn(`[scraper] AppStore RSS ${country} p${page} → HTTP ${res.status}`)
        break
      }

      const data = await res.json()
      const entries: any[] = data?.feed?.entry ?? []

      // First entry is app metadata (no rating field) — skip it on page 1
      const reviewEntries = page === 1 ? entries.slice(1) : entries
      if (reviewEntries.length === 0) break

      const mapped = reviewEntries
        .map((r: any, i: number) => ({
          id: `as_${appId}_${country}_p${page}_${r.id?.label ?? i}`,
          text: (r.content?.label ?? '').trim(),
          rating: parseInt(r['im:rating']?.label ?? '3', 10),
          date: r.updated?.label
            ? new Date(r.updated.label).toISOString()
            : new Date().toISOString(),
          store: 'appstore' as const,
          thumbsUp: 0,
        }))
        .filter((r: RawReview) => r.text.length > 20)

      results.push(...mapped)
      await sleep(400)
    } catch (err: any) {
      console.warn(`[scraper] AppStore RSS ${country} p${page} failed:`, err?.message ?? err)
      break
    }
  }

  return results
}

export function filterRelevantReviews(
  reviews: RawReview[],
  focusArea: string,
  keywords: string[]
): RawReview[] {
  return reviews.filter(r => {
    const text = r.text.toLowerCase()
    const isLowRating = r.rating <= 3
    const hasKeyword = keywords.some(k => text.includes(k.toLowerCase()))
    return isLowRating || hasKeyword
  })
}
