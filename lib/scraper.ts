// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require('app-store-scraper')

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

// Apple's iTunes RSS API is unreliable for country='in'.
// We try 'in' → 'us' → 'gb' in sequence and merge unique results.
const AS_COUNTRIES = ['in', 'us', 'gb']

export async function scrapeAppStore(
  appId: AppId,
  pages = 3
): Promise<RawReview[]> {
  const app = APPS[appId]
  const seen = new Set<string>()
  const all: RawReview[] = []

  for (const country of AS_COUNTRIES) {
    const countryResults = await scrapeAppStoreCountry(app.appStoreId, appId, country, pages)
    for (const r of countryResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        all.push(r)
      }
    }
    if (all.length >= 50) break
    await sleep(500)
  }

  return all
}

async function scrapeAppStoreCountry(
  appStoreId: string,
  appId: AppId,
  country: string,
  pages: number
): Promise<RawReview[]> {
  const results: RawReview[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const raw = await store.reviews({
        id: appStoreId,
        country,
        sort: store.sort.RECENT,
        page,
      })

      const list: any[] = Array.isArray(raw) ? raw : []
      if (list.length === 0) break

      const mapped = list
        .map((r: any, i: number) => ({
          id: `as_${appId}_${country}_p${page}_${r.id ?? i}`,
          text: (r.text ?? r.body ?? '').trim(),
          rating: r.score ?? r.rating ?? 3,
          date: r.updated
            ? new Date(r.updated).toISOString()
            : new Date().toISOString(),
          store: 'appstore' as const,
          thumbsUp: 0,
        }))
        .filter((r: RawReview) => r.text.length > 20)

      results.push(...mapped)
      await sleep(600)
    } catch (err: any) {
      console.warn(`[scraper] AppStore ${country} p${page} failed:`, err?.message ?? err)
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
