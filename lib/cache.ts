import { supabase } from './supabase'
import { Report } from '@/types'

// ── Supabase persistence ──────────────────────────────────────────────────────

function strip(report: Report): Report {
  return {
    ...report,
    screenAnalyses: report.screenAnalyses.map(s => {
      const { base64, ...rest } = s
      return rest
    }),
  }
}

export async function saveReport(slug: string, report: Report): Promise<boolean> {
  if (!supabase) return false
  const r = strip(report)
  const { error } = await supabase.from('reports').upsert({
    slug:                    r.slug,
    app_id:                  r.appId,
    app_name:                r.appName,
    generated_at:            r.generatedAt,
    total_reviews_scraped:   r.totalReviewsScraped,
    total_reviews_analysed:  r.totalReviewsAnalysed,
    avg_rating:              r.avgRating,
    pain_points:             r.painPoints,
    screen_analyses:         r.screenAnalyses,
    has_screenshots:         r.hasScreenshots,
    focus_area:              r.focusArea,
    platform:                r.platform ?? 'both',
    time_filter:             r.timeFilter ?? 'all',
    competitors:             r.competitors ?? [],
    competitor_sentiments:   r.competitorSentiments ?? [],
    competitive_insights:    r.competitiveInsights ?? [],
    paytm_sentiment:         r.paytmSentiment ?? null,
    expires_at:              r.expiresAt,
  })
  if (error) {
    console.error('[cache] supabase save failed:', error.message)
    return false
  }
  return true
}

export async function getReport(slug: string): Promise<Report | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return rowToReport(data)
}

export async function listReports(limit = 50): Promise<Report[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(rowToReport)
}

function rowToReport(row: any): Report {
  return {
    slug:                   row.slug,
    appId:                  row.app_id,
    appName:                row.app_name,
    generatedAt:            row.generated_at,
    totalReviewsScraped:    row.total_reviews_scraped,
    totalReviewsAnalysed:   row.total_reviews_analysed,
    avgRating:              Number(row.avg_rating),
    painPoints:             row.pain_points ?? [],
    screenAnalyses:         row.screen_analyses ?? [],
    hasScreenshots:         row.has_screenshots ?? false,
    focusArea:              row.focus_area ?? 'all',
    platform:               row.platform ?? 'both',
    timeFilter:             row.time_filter ?? 'all',
    competitors:            row.competitors ?? [],
    competitorSentiments:   row.competitor_sentiments ?? [],
    competitiveInsights:    row.competitive_insights ?? [],
    paytmSentiment:         row.paytm_sentiment ?? undefined,
    expiresAt:              row.expires_at,
  }
}

// ── In-memory fallback (local dev without Supabase) ───────────────────────────
const g = global as typeof global & { __reviewSenseStore?: Map<string, Report> }
if (!g.__reviewSenseStore) g.__reviewSenseStore = new Map<string, Report>()
const memStore = g.__reviewSenseStore

export function saveReportMem(slug: string, report: Report) {
  memStore.set(slug, strip(report))
}

export function getReportMem(slug: string): Report | null {
  return memStore.get(slug) ?? null
}

export function listReportsMem(): Report[] {
  return Array.from(memStore.values()).sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  )
}
