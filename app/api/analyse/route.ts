import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { scrapePlayStore, scrapeAppStore, filterRelevantReviews, applyTimeFilter } from '@/lib/scraper'
import { tagReviews } from '@/lib/tagger'
import { buildPainPoints } from '@/lib/analyzer'
import { buildCompetitorSentiment, buildPaytmSentiment, generateCompetitiveInsights } from '@/lib/competitiveAnalyzer'
import { saveReport, saveReportMem } from '@/lib/cache'
import { APPS, RELEVANCE_KEYWORDS } from '@/lib/constants'
import { AppId, Platform, TimeFilter, ScreenAnalysis, RawReview, CompetitorSentiment } from '@/types'

export const maxDuration = 60

const TIME_LABELS: Record<TimeFilter, string> = {
  today: 'today',
  week: 'this week',
  month: 'this month',
  all: 'all time',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    focusArea,
    platform = 'both',
    timeFilter = 'week',
    competitors = [],
    screenAnalyses,
  } = body as {
    appId: AppId
    focusArea: string
    platform: Platform
    timeFilter: TimeFilter
    competitors: AppId[]
    screenAnalyses: ScreenAnalysis[]
  }

  const slug = uuid().slice(0, 8)
  const allApps: AppId[] = ['paytm', ...competitors]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      function emit(step: string, status: string, detail?: string) {
        if (closed) return
        const data = JSON.stringify({ step, status, detail, slug })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      try {
        // ── Step 1: Scrape all apps ────────────────────────────────────────────
        const rawByApp: Record<AppId, RawReview[]> = {} as any

        for (const appId of allApps) {
          const appName = APPS[appId].name
          let appReviews: RawReview[] = []

          if (platform !== 'ios') {
            emit(`Scraping ${appName} Play Store`, 'running', `Fetching ${appName} reviews...`)
            const ps = await scrapePlayStore(appId, 300)
            appReviews.push(...ps)
            emit(`Scraping ${appName} Play Store`, ps.length ? 'done' : 'error',
              ps.length ? `${ps.length} reviews fetched` : 'Rate limited — try again shortly')
            if (appId === 'paytm' && ps.length === 0 && platform === 'android') {
              emit('COMPLETE', 'error', 'rate_limited')
              return
            }
          }

          if (platform !== 'android') {
            emit(`Scraping ${appName} App Store`, 'running', 'Fetching iOS reviews...')
            const as = await scrapeAppStore(appId, 5)
            appReviews.push(...as)
            emit(`Scraping ${appName} App Store`, as.length ? 'done' : 'error',
              as.length ? `${as.length} reviews fetched` : 'App Store unavailable — continuing without iOS')
          }

          rawByApp[appId] = appReviews
        }

        // ── Step 2: Time filter ────────────────────────────────────────────────
        if (timeFilter !== 'all') {
          emit('Applying time filter', 'running', `Keeping reviews from ${TIME_LABELS[timeFilter]}...`)
          for (const appId of allApps) {
            rawByApp[appId] = applyTimeFilter(rawByApp[appId], timeFilter)
          }
          const totalAfterFilter = allApps.reduce((s, id) => s + rawByApp[id].length, 0)
          emit('Applying time filter', 'done', `${totalAfterFilter} reviews in window`)
        }

        // Paytm reviews for primary analysis
        const paytmRaw = rawByApp['paytm'] ?? []
        if (paytmRaw.length === 0) {
          emit('Error', 'error', `No Paytm reviews found for ${TIME_LABELS[timeFilter]}. Try a wider time window.`)
          emit('COMPLETE', 'error', 'no_reviews')
          return
        }

        const allRawFlat = allApps.flatMap(id => rawByApp[id])
        const avgRating = paytmRaw.reduce((s, r) => s + r.rating, 0) / paytmRaw.length

        // ── Step 3: Filter + tag Paytm ─────────────────────────────────────────
        emit('Filtering relevant reviews', 'running', 'Identifying relevant Paytm reviews...')
        const paytmFiltered = filterRelevantReviews(paytmRaw, focusArea, RELEVANCE_KEYWORDS)
        emit('Filtering relevant reviews', 'done', `${paytmFiltered.length} Paytm reviews selected`)

        emit('Tagging reviews with AI', 'running', `Analysing ${paytmFiltered.length} Paytm reviews...`)
        const paytmTagged = await tagReviews(paytmFiltered, 'paytm', (done, total) => {
          emit('Tagging reviews with AI', 'running', `Tagged ${done}/${total} Paytm reviews...`)
        })
        emit('Tagging reviews with AI', 'done', `${paytmTagged.length} reviews classified`)

        // ── Step 4: Pain points ────────────────────────────────────────────────
        emit('Identifying pain points', 'running', 'Scoring Paytm pain points...')
        const painPoints = buildPainPoints(paytmTagged)
        emit('Identifying pain points', 'done', `${painPoints.length} pain points ranked`)

        // ── Step 5: Competitive analysis ───────────────────────────────────────
        const competitorSentiments: CompetitorSentiment[] = []
        let competitiveInsights: any[] = []

        // Always compute Paytm sentiment (analytical, no GPT)
        let paytmSentiment = buildPaytmSentiment(paytmTagged, painPoints)

        if (competitors.length > 0) {
          emit('Running competitive analysis', 'running', 'Tagging competitor reviews...')

          // Tag all competitors in parallel to stay within the 60s Vercel limit
          const competitorResults = await Promise.all(
            competitors.map(async (cid) => {
              const cRaw = rawByApp[cid] ?? []
              if (cRaw.length === 0) return null
              const cFiltered = filterRelevantReviews(cRaw, focusArea, RELEVANCE_KEYWORDS)
              const cTagged = await tagReviews(cFiltered.slice(0, 40), cid, () => {}, 600)
              const cPainPoints = buildPainPoints(cTagged)
              const cAvgRating = cRaw.reduce((s, r) => s + r.rating, 0) / (cRaw.length || 1)
              return buildCompetitorSentiment(cid, cTagged, cPainPoints, cRaw.length, Math.round(cAvgRating * 10) / 10)
            })
          )
          for (const cs of competitorResults) {
            if (cs) competitorSentiments.push(cs)
          }

          const result = await generateCompetitiveInsights(
            painPoints,
            paytmTagged,
            competitorSentiments,
            TIME_LABELS[timeFilter],
          )
          competitiveInsights = result.insights

          // Enrich sentiment patterns from GPT output
          if (result.sentimentPatterns.paytm?.length) {
            paytmSentiment = { ...paytmSentiment, reviewPatterns: result.sentimentPatterns.paytm }
          }
          for (const cs of competitorSentiments) {
            const patterns = result.sentimentPatterns[cs.appId]
            if (patterns?.length) cs.reviewPatterns = patterns
          }

          emit('Running competitive analysis', 'done',
            `${competitiveInsights.length} strategic insights generated`)
        }

        // ── Step 6: Save ───────────────────────────────────────────────────────
        emit('Saving report', 'running', 'Caching results...')
        const report = {
          slug,
          appId: 'paytm' as AppId,
          appName: APPS.paytm.name,
          generatedAt: new Date().toISOString(),
          totalReviewsScraped: allRawFlat.length,
          totalReviewsAnalysed: paytmTagged.length,
          avgRating: Math.round(avgRating * 10) / 10,
          painPoints,
          screenAnalyses: screenAnalyses ?? [],
          hasScreenshots: (screenAnalyses ?? []).length > 0,
          focusArea,
          platform,
          timeFilter,
          competitors,
          competitorSentiments,
          competitiveInsights,
          paytmSentiment,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }

        const saved = await saveReport(slug, report)
        if (!saved) saveReportMem(slug, report)
        emit('Saving report', 'done', 'Report ready')
        emit('COMPLETE', 'done', slug)
      } catch (err: any) {
        const msg = err?.message ?? String(err)
        console.error('[api/analyse]', msg, err)
        emit('Error', 'error', msg)
      } finally {
        if (!closed) {
          closed = true
          controller.close()
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
