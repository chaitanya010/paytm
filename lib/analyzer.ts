import { TaggedReview, PainPoint, PainCategory } from '@/types'

export function buildPainPoints(reviews: TaggedReview[]): PainPoint[] {
  const groups = new Map<PainCategory, TaggedReview[]>()

  reviews.forEach(r => {
    if (!groups.has(r.category)) groups.set(r.category, [])
    groups.get(r.category)!.push(r)
  })

  const points: PainPoint[] = []

  groups.forEach((group, category) => {
    if (category === 'other') return
    const avgSeverity = group.reduce((s, r) => s + r.severity, 0) / group.length
    const score = group.length * avgSeverity

    const sorted = [...group].sort(
      (a, b) => (b.severity * 2 + (b.thumbsUp ?? 0))
               - (a.severity * 2 + (a.thumbsUp ?? 0))
    )
    const topVerbatims = sorted
      .slice(0, 3)
      .map(r => r.keyPhrase)
      .filter(Boolean)

    points.push({
      category,
      title: categoryTitle(category),
      frequency: group.length,
      avgSeverity: Math.round(avgSeverity * 10) / 10,
      score: Math.round(score),
      topVerbatims,
      representativeReviews: sorted.slice(0, 5),
      isIndustryWide: false,
    })
  })

  return points.sort((a, b) => b.score - a.score)
}

function categoryTitle(cat: PainCategory): string {
  const map: Record<PainCategory, string> = {
    payment_failure:           'Payments failing — money deducted, not delivered',
    recharge_failure:          'Recharge deducted but not applied',
    plan_discovery:            'Plan selection is confusing and hard to compare',
    bill_payment_failure:      'Bill payments failing or not getting credited',
    financial_services_issues: 'Loan / credit card / insurance friction',
    wealth_investing:          'Investment transactions failing or stuck',
    travel_booking:            'Travel bookings failing or refunds delayed',
    cashback_rewards:          'Cashback promised but not delivered',
    merchant_issues:           'Merchant settlements delayed or tools failing',
    kyc_fraud_safety:          'KYC friction, fraud exposure, account blocked',
    ui_navigation:             'App is cluttered and hard to navigate',
    performance:               'App crashes, slow loading, error screens',
    customer_support:          'Support unresponsive — issues going unresolved',
    onboarding_account:        'Account setup and login barriers',
    other:                     'Other issues',
  }
  return map[cat]
}
