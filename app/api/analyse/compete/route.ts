import { NextRequest, NextResponse } from 'next/server'
import { tagReviews } from '@/lib/tagger'
import { buildPainPoints } from '@/lib/analyzer'
import { buildCompetitorSentiment, generateCompetitiveInsights, PaytmStats } from '@/lib/competitiveAnalyzer'
import { getReport, getReportMem, saveReport, saveReportMem } from '@/lib/cache'
import { AppId, TimeFilter, RawReview } from '@/types'

export const maxDuration = 60

const TIME_LABELS: Record<TimeFilter, string> = {
  today: 'today',
  week: 'this week',
  month: 'this month',
  all: 'all time',
}

export async function POST(req: NextRequest) {
  try {
    const { slug, competitorRaw, paytmStats, timeFilter } = await req.json() as {
      slug: string
      competitorRaw: Record<string, RawReview[]>
      paytmStats: PaytmStats
      focusArea: string
      timeFilter: TimeFilter
    }

    // Load the partial report saved by phase 1
    const report = (await getReport(slug)) ?? getReportMem(slug)
    if (!report) {
      return NextResponse.json({ ok: false, error: 'Partial report not found' }, { status: 404 })
    }

    const competitors = Object.keys(competitorRaw) as AppId[]

    // Tag both competitors in parallel
    const sentimentResults = await Promise.all(
      competitors.map(async (cid) => {
        const reviews = competitorRaw[cid] ?? []
        if (reviews.length === 0) return null
        const tagged = await tagReviews(reviews as RawReview[], cid, () => {}, 600)
        const painPoints = buildPainPoints(tagged)
        const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)
        return buildCompetitorSentiment(
          cid,
          tagged,
          painPoints,
          reviews.length,
          Math.round(avgRating * 10) / 10,
        )
      })
    )
    const competitorSentiments = sentimentResults.filter(Boolean) as Awaited<typeof sentimentResults[0]>[]

    // Generate GPT-powered competitive insights
    const { insights, sentimentPatterns } = await generateCompetitiveInsights(
      report.painPoints,
      paytmStats,
      competitorSentiments as any,
      TIME_LABELS[timeFilter] ?? timeFilter,
    )

    // Merge GPT sentiment patterns back into the data
    let paytmSentiment = report.paytmSentiment
    if (sentimentPatterns.paytm?.length) {
      paytmSentiment = { ...paytmSentiment!, reviewPatterns: sentimentPatterns.paytm }
    }
    for (const cs of competitorSentiments as any[]) {
      if (!cs) continue
      const patterns = sentimentPatterns[cs.appId]
      if (patterns?.length) cs.reviewPatterns = patterns
    }

    // Save the completed report
    const updatedReport = {
      ...report,
      competitorSentiments: competitorSentiments as any,
      competitiveInsights: insights,
      paytmSentiment,
    }
    const saved = await saveReport(slug, updatedReport)
    if (!saved) saveReportMem(slug, updatedReport)

    return NextResponse.json({ ok: true, insights: insights.length })
  } catch (err: any) {
    console.error('[api/analyse/compete]', err)
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}
