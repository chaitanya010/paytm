import OpenAI from 'openai'
import { RawReview, TaggedReview, AppId, PainCategory } from '@/types'

const client = new OpenAI()

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export async function tagReviews(
  reviews: RawReview[],
  appId: AppId,
  onProgress?: (done: number, total: number) => void
): Promise<TaggedReview[]> {
  const BATCH = 8        // smaller batches → fewer tokens per request
  const MAX_REVIEWS = 80 // cap total to stay within TPM limits
  const input = reviews.slice(0, MAX_REVIEWS)
  const tagged: TaggedReview[] = []

  for (let i = 0; i < input.length; i += BATCH) {
    const batch = input.slice(i, i + BATCH)
    const result = await tagBatch(batch, appId)
    tagged.push(...result)
    onProgress?.(Math.min(i + BATCH, input.length), input.length)
    if (i + BATCH < input.length) await sleep(2000) // 2s gap to avoid TPM burst
  }

  return tagged.filter(r => r.isRelevant)
}

async function tagBatch(
  reviews: RawReview[],
  appId: AppId
): Promise<TaggedReview[]> {
  const prompt = `You are a senior UX researcher and product analyst classifying Indian fintech app reviews for Paytm — a super-app covering Payments, Telco, Utilities, Financial Services, Wealth, Travel, Commerce, Merchant tools, Trust & Safety, and App Experience.

For each review, classify it. Return a JSON array with one object per review.

Each object:
{
  "index": <number, 0-based>,
  "category": one of exactly:
    "payment_failure"           (UPI / Wallet / Money Transfer / QR / FASTag failures — money not sent, transaction stuck) |
    "recharge_failure"          (Mobile / DTH / Broadband / Landline / Data Card recharge failed or not credited) |
    "plan_discovery"            (Can't find right telecom plan, plan info missing, plan comparison issues) |
    "bill_payment_failure"      (Electricity / Water / Gas / LPG / Municipal / Education fees not paid or credited) |
    "financial_services_issues" (Personal / Merchant Loans, Credit Cards, Insurance, Postpaid — approval, EMI, billing issues) |
    "wealth_investing"          (Stocks / Mutual Funds / IPOs / ETFs / Gold — buy/sell failures, portfolio errors, KYC for investing) |
    "travel_booking"            (Flights / Trains / Buses / Hotels / Metro — booking failures, refunds, cancellations) |
    "cashback_rewards"          (Cashback not received, promo/coupon not applied, Gift Cards, Rewards, Deals not working) |
    "merchant_issues"           (Soundbox offline, settlement delayed, POS failure, Business QR, Payment Gateway issues) |
    "kyc_fraud_safety"          (KYC pending/rejected, fraud / scam, account blocked/frozen, security breach, compliance) |
    "ui_navigation"             (Homepage cluttered, search not working, discovery poor, confusing navigation, accessibility) |
    "performance"               (App crash, slow loading, error screens, black screen, app not opening) |
    "customer_support"          (Support not responding, ticket unresolved, helpline unreachable, chat bot useless) |
    "onboarding_account"        (Account creation, mobile verification, login issues, password reset, profile setup) |
    "other"                     (Anything not fitting the above — general praise, irrelevant content),
  "sentiment": "positive" | "negative" | "neutral",
  "severity": <integer 1-5, where 5=user is very angry/blocked>,
  "isRelevant": <true if about any Paytm service or app experience, false only if completely unrelated>,
  "keyPhrase": <verbatim 10-15 word extract capturing the core complaint or praise>
}

Severity guide:
5 = money lost, account blocked, app completely broken for the user
4 = major feature not working, repeated failure with no resolution
3 = frustrating but a workaround exists
2 = minor annoyance or inconvenience
1 = mild suggestion or preference

Reviews to classify:
${JSON.stringify(reviews.map((r, i) => ({
  index: i,
  text: r.text,
  rating: r.rating,
  store: r.store,
})))}

Return ONLY a valid JSON array. No explanation. No markdown fences.`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.choices[0].message.content?.trim() ?? '[]'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean) as any[]

      return parsed.map((p, idx) => ({
        ...reviews[p.index ?? idx],
        appId,
        category: (p.category ?? 'other') as PainCategory,
        sentiment: (p.sentiment ?? 'negative') as 'positive' | 'negative' | 'neutral',
        severity: p.severity ?? 3,
        isRelevant: p.isRelevant ?? true,
        keyPhrase: p.keyPhrase ?? reviews[p.index ?? idx].text.slice(0, 80),
      }))
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.code === 'rate_limit_exceeded'
      if (isRateLimit && attempt < 2) {
        // parse reset time from headers if available, otherwise back off exponentially
        const retryAfterMs = attempt === 0 ? 5000 : 15000
        console.warn(`[tagger] rate limited, retrying in ${retryAfterMs}ms...`)
        await sleep(retryAfterMs)
        continue
      }
      if (attempt < 2 && !isRateLimit) {
        await sleep(2000)
        continue
      }
      console.error('[tagger] batch failed:', err)
      return reviews.map(r => ({
        ...r, appId,
        category: 'other' as PainCategory,
        sentiment: 'negative' as const,
        severity: 3,
        isRelevant: true,
        keyPhrase: r.text.slice(0, 80),
      }))
    }
  }
  return []
}
