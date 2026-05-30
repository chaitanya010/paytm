import OpenAI from 'openai'
import { AppId, PainPoint, TaggedReview, CompetitorSentiment, CompetitiveInsight, SentimentBreakdown } from '@/types'
import { APPS } from './constants'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Sentiment helpers ─────────────────────────────────────────────────────────

function computeSentimentBreakdown(tagged: TaggedReview[]): SentimentBreakdown {
  const total = tagged.length || 1
  return {
    positive: Math.round((tagged.filter(r => r.sentiment === 'positive').length / total) * 100),
    negative: Math.round((tagged.filter(r => r.sentiment === 'negative').length / total) * 100),
    neutral:  Math.round((tagged.filter(r => r.sentiment === 'neutral').length  / total) * 100),
  }
}

// Analytical (no GPT) — derives patterns from tagged review data
function deriveReviewPatterns(tagged: TaggedReview[], painPoints: PainPoint[]): string[] {
  const patterns: string[] = []
  const total = tagged.length || 1

  for (const pp of painPoints.slice(0, 3)) {
    const pct = Math.round((pp.frequency / total) * 100)
    patterns.push(`${pp.frequency} reviews (${pct}%) flagged: ${pp.title}`)
  }

  const highSev = tagged.filter(r => r.severity >= 4).length
  if (highSev > 0) {
    const pct = Math.round((highSev / total) * 100)
    patterns.push(`${highSev} reviews (${pct}%) at severity 4–5 — users blocked or lost money`)
  }

  const neg = tagged.filter(r => r.sentiment === 'negative').length
  if (neg > total * 0.6) {
    patterns.push(`${Math.round((neg / total) * 100)}% negative sentiment — majority of reviewers dissatisfied`)
  }

  return patterns
}

export function buildPaytmSentiment(
  tagged: TaggedReview[],
  painPoints: PainPoint[],
): { sentimentBreakdown: SentimentBreakdown; reviewPatterns: string[] } {
  return {
    sentimentBreakdown: computeSentimentBreakdown(tagged),
    reviewPatterns: deriveReviewPatterns(tagged, painPoints),
  }
}

export function buildCompetitorSentiment(
  appId: AppId,
  taggedReviews: TaggedReview[],
  painPoints: PainPoint[],
  totalReviews: number,
  avgRating: number,
): CompetitorSentiment {
  return {
    appId,
    appName: APPS[appId].name,
    color: APPS[appId].color,
    totalReviews,
    avgRating,
    topCategories: painPoints.slice(0, 5).map(pp => ({
      category: pp.category,
      title: pp.title,
      frequency: pp.frequency,
      score: pp.score,
    })),
    sentimentBreakdown: computeSentimentBreakdown(taggedReviews),
    reviewPatterns: deriveReviewPatterns(taggedReviews, painPoints),
  }
}

// ── Competitive intelligence (GPT) ───────────────────────────────────────────

export async function generateCompetitiveInsights(
  paytmPainPoints: PainPoint[],
  paytmTagged: TaggedReview[],
  competitorSentiments: CompetitorSentiment[],
  timeLabel: string,
): Promise<{ insights: CompetitiveInsight[]; sentimentPatterns: Record<string, string[]> }> {
  const paytmTotal = paytmTagged.length || 1

  const paytmSummary = paytmPainPoints.slice(0, 6).map((pp, i) =>
    `${i + 1}. ${pp.title}\n   Frequency: ${pp.frequency} reviews (${Math.round((pp.frequency / paytmTotal) * 100)}% of tagged)\n   Avg severity: ${pp.avgSeverity}/5  Score: ${pp.score}\n   Top verbatim: "${pp.topVerbatims[0] ?? '—'}"`
  ).join('\n')

  const paytmSentimentSummary =
    `Positive: ${Math.round((paytmTagged.filter(r => r.sentiment === 'positive').length / paytmTotal) * 100)}% | ` +
    `Negative: ${Math.round((paytmTagged.filter(r => r.sentiment === 'negative').length / paytmTotal) * 100)}% | ` +
    `Neutral: ${Math.round((paytmTagged.filter(r => r.sentiment === 'neutral').length / paytmTotal) * 100)}%`

  const competitorSummary = competitorSentiments.map(cs => {
    const cTotal = cs.totalReviews || 1
    return (
      `${cs.appName} — avg rating: ${cs.avgRating} | ${cs.totalReviews} reviews scraped\n` +
      `Sentiment: Pos ${cs.sentimentBreakdown.positive}% | Neg ${cs.sentimentBreakdown.negative}% | Neu ${cs.sentimentBreakdown.neutral}%\n` +
      cs.topCategories.map(c =>
        `  • ${c.title} — ${c.frequency} reviews (${Math.round((c.frequency / cTotal) * 100)}%)`
      ).join('\n')
    )
  }).join('\n\n')

  const prompt = `You are a Senior Product Intelligence Analyst. Your role is to extract EVIDENCE-BACKED competitive intelligence from app review data — not invent features.

TIME WINDOW: ${timeLabel}
PRIMARY APP: Paytm (${paytmTotal} tagged reviews)
PAYTM SENTIMENT: ${paytmSentimentSummary}

PAYTM TOP PAIN POINTS (ranked by severity × frequency):
${paytmSummary}

COMPETITOR DATA:
${competitorSummary}

═══════════════════════════════════════════
STRICT RULES — VIOLATIONS INVALIDATE OUTPUT
═══════════════════════════════════════════

1. NEVER recommend pricing changes, cashback changes, discounts, rewards changes, or business model changes unless DIRECTLY supported by verbatim evidence from reviews.

2. EVERY recommendedAction MUST specify WHAT + WHERE (exact screen and component) + HOW. Forbidden alone: "Improve UX", "Enhance onboarding", "Simplify interface", "Improve transparency", "Better navigation", "Streamline journey".

3. Competitor insights require ALL THREE: (a) Paytm issue exists in data, (b) competitor issue frequency is lower, (c) evidence from competitor reviews. If any condition is unmet: set competitorBenchmark to "No meaningful competitive gap detected."

4. rootCauseHypothesis must cite specific evidence. If insufficient: "Insufficient evidence for root-cause analysis."

5. Recommendations must be feasible by: Product / Design / Engineering / Support / Operations. No marketing campaigns, strategic pivots, pricing changes, regulatory changes, or new business models.

6. Smallest possible intervention that can realistically be shipped.

7. Priority Score = frequency_raw × severity (1–5) × competitor_gap (1=no gap, 2=partial, 3=clear gap).

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Return a valid JSON object with two keys — no markdown, no explanation:

{
  "sentimentPatterns": {
    "paytm": ["pattern1", "pattern2", "pattern3"],
    "phonepe": ["pattern1"],
    "gpay": ["pattern1"]
  },
  "insights": [
    {
      "type": "paytm_critical|competitor_advantage|industry_wide|paytm_strength",
      "title": "Max 8 words — specific, no generic phrases",
      "detail": "2 sentences with specific data from reviews above. Name the category and cite numbers.",
      "priority": "high|medium|low",
      "evidence": "Verbatim quote from review data or specific numeric finding",
      "frequency": "e.g. '23 of 80 reviews (29%)'",
      "severity": <1-5>,
      "rootCauseHypothesis": "Specific technical/product hypothesis — cite evidence OR 'Insufficient evidence for root-cause analysis.'",
      "competitorBenchmark": "e.g. 'PhonePe: 8% frequency vs Paytm: 29%' OR 'No meaningful competitive gap detected.'",
      "recommendedAction": "WHAT: [specific feature/change] WHERE: [Screen Name > Component Name] HOW: [specific implementation step]",
      "suggestedAction": "One-line PM-ready version of recommendedAction",
      "expectedMetricImpact": "Specific metric + direction, e.g. 'Reduce payment failure complaint rate from 29% to <15%'",
      "confidenceScore": <0.0-1.0>,
      "priorityScore": <frequency_raw × severity × competitor_gap_1_to_3>,
      "relatedApps": ["paytm"]
    }
  ]
}

sentimentPatterns: 2–4 bullet strings per app summarising dominant review patterns (frequencies, trends, severity spikes). Only include apps present in the data. Be specific — cite numbers from the data above.

Generate 5–7 insights covering the highest priority opportunities.`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.choices[0].message.content?.trim() ?? '{}'
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      sentimentPatterns: parsed.sentimentPatterns ?? {},
    }
  } catch (err) {
    console.error('[competitiveAnalyzer] failed:', err)
    return { insights: [], sentimentPatterns: {} }
  }
}
