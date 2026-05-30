export type AppId = 'paytm' | 'phonepe' | 'gpay'
export type Platform = 'android' | 'ios' | 'both'
export type TimeFilter = 'today' | 'week' | 'month' | 'all'

export type PainCategory =
  | 'payment_failure'           // UPI / Wallet / Transfer / QR / FASTag failures
  | 'recharge_failure'          // Mobile / DTH / Broadband / Landline recharge failures
  | 'plan_discovery'            // Finding the right telecom plan, missing plan info
  | 'bill_payment_failure'      // Electricity / Water / Gas / Utility / Education bill failures
  | 'financial_services_issues' // Loans / Credit Cards / Insurance / Postpaid issues
  | 'wealth_investing'          // Stocks / MF / IPO / ETF / Gold issues
  | 'travel_booking'            // Flights / Trains / Buses / Hotels / Metro booking issues
  | 'cashback_rewards'          // Cashback / Deals / Gift Cards / Rewards / Promo issues
  | 'merchant_issues'           // Soundbox / Settlement / POS / Business QR issues
  | 'kyc_fraud_safety'          // KYC / Fraud / Compliance / Account Security issues
  | 'ui_navigation'             // Homepage / Search / Discovery / Navigation issues
  | 'performance'               // App crashes / slow / errors / loading issues
  | 'customer_support'          // Support unresponsive / resolution failure
  | 'onboarding_account'        // Account creation / verification / login issues
  | 'other'

export interface RawReview {
  id: string
  text: string
  rating: number
  date: string
  store: 'playstore' | 'appstore'
  thumbsUp?: number
}

export interface TaggedReview extends RawReview {
  appId: AppId
  category: PainCategory
  sentiment: 'positive' | 'negative' | 'neutral'
  severity: number
  isRelevant: boolean
  keyPhrase: string
}

export interface PainPoint {
  category: PainCategory
  title: string
  frequency: number
  avgSeverity: number
  score: number
  topVerbatims: string[]
  representativeReviews: TaggedReview[]
  isIndustryWide: boolean
}

export interface ScreenAnalysis {
  screenIndex: number
  screenName: string
  layoutDescription: string
  keyElements: {
    element: string
    position: string
    currentState: string
    potentialIssue: string
  }[]
  uxSmell: string
  positiveAspects: string[]
  base64?: string
}

export interface SentimentBreakdown {
  positive: number  // 0–100 percentage
  negative: number
  neutral: number
}

export interface CompetitorSentiment {
  appId: AppId
  appName: string
  color: string
  totalReviews: number
  avgRating: number
  topCategories: Array<{
    category: PainCategory
    title: string
    frequency: number
    score: number
  }>
  sentimentBreakdown: SentimentBreakdown
  reviewPatterns: string[]  // e.g. ["29% of reviews about payment failures", "KYC complaints rising"]
}

export interface CompetitiveInsight {
  type: 'paytm_critical' | 'competitor_advantage' | 'industry_wide' | 'paytm_strength'
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
  suggestedAction: string
  relatedApps: AppId[]
  // Structured intelligence fields — populated when strict-mode analysis runs
  evidence?: string           // verbatim review quote or specific data point
  frequency?: string          // e.g. "23 of 80 reviews (29%)"
  severity?: number           // 1–5
  rootCauseHypothesis?: string
  competitorBenchmark?: string // e.g. "PhonePe: 8% vs Paytm: 29%" or "No meaningful competitive gap detected."
  recommendedAction?: string   // WHAT: ... WHERE: Screen > Component HOW: ...
  expectedMetricImpact?: string
  confidenceScore?: number     // 0.0–1.0
  priorityScore?: number       // frequency_raw × severity × competitor_gap
}

export interface Report {
  slug: string
  appId: AppId
  appName: string
  generatedAt: string
  totalReviewsScraped: number
  totalReviewsAnalysed: number
  avgRating: number
  painPoints: PainPoint[]
  screenAnalyses: ScreenAnalysis[]
  hasScreenshots: boolean
  focusArea: string
  platform: Platform
  timeFilter: TimeFilter
  competitors: AppId[]
  competitorSentiments: CompetitorSentiment[]
  competitiveInsights: CompetitiveInsight[]
  paytmSentiment?: {
    sentimentBreakdown: SentimentBreakdown
    reviewPatterns: string[]
  }
  expiresAt: string
}

export interface ProgressEvent {
  step: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}
