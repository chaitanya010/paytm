export const APPS = {
  paytm: {
    id: 'paytm',
    name: 'Paytm',
    playStoreId: 'net.one97.paytm',
    appStoreId: '473941634',
    color: '#00B9F1',
    bgColor: '#E6F9FF',
    description: 'Payments, recharge & financial services',
  },
  phonepe: {
    id: 'phonepe',
    name: 'PhonePe',
    playStoreId: 'com.phonepe.app',
    appStoreId: '1170055821',
    color: '#5F259F',
    bgColor: '#F3EEFF',
    description: 'UPI payments & recharge',
  },
  gpay: {
    id: 'gpay',
    name: 'Google Pay',
    playStoreId: 'com.google.android.apps.nbu.paisa.user',
    appStoreId: '1193357041',
    color: '#4285F4',
    bgColor: '#EEF4FF',
    description: 'Google UPI & payments app',
  },
} as const

export const FOCUS_AREAS = [
  { value: 'all',                label: 'All issues' },
  { value: 'payments',           label: 'Payments & UPI' },
  { value: 'telco',              label: 'Telco' },
  { value: 'utilities',          label: 'Utilities' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'wealth',             label: 'Wealth' },
  { value: 'travel',             label: 'Travel' },
  { value: 'commerce',           label: 'Commerce' },
  { value: 'merchant',           label: 'Merchant' },
  { value: 'trust_safety',       label: 'Trust & Safety' },
  { value: 'experience',         label: 'Experience' },
]

export const CATEGORY_META: Record<string, {
  label: string; color: string; bg: string
}> = {
  payment_failure:           { label: 'Payment failure',       color: '#DC2626', bg: '#FEF2F2' },
  recharge_failure:          { label: 'Recharge failure',      color: '#EA580C', bg: '#FFF7ED' },
  plan_discovery:            { label: 'Plan discovery',        color: '#D97706', bg: '#FFFBEB' },
  bill_payment_failure:      { label: 'Bill payment failure',  color: '#DC2626', bg: '#FEF2F2' },
  financial_services_issues: { label: 'Financial services',    color: '#7C3AED', bg: '#F5F3FF' },
  wealth_investing:          { label: 'Wealth & investing',    color: '#0D9488', bg: '#F0FDFA' },
  travel_booking:            { label: 'Travel booking',        color: '#2563EB', bg: '#EFF6FF' },
  cashback_rewards:          { label: 'Cashback & rewards',    color: '#059669', bg: '#ECFDF5' },
  merchant_issues:           { label: 'Merchant issues',       color: '#9333EA', bg: '#FAF5FF' },
  kyc_fraud_safety:          { label: 'KYC / Fraud / Safety',  color: '#DC2626', bg: '#FEF2F2' },
  ui_navigation:             { label: 'UI & navigation',       color: '#7C3AED', bg: '#F5F3FF' },
  performance:               { label: 'Performance',           color: '#6B7280', bg: '#F9FAFB' },
  customer_support:          { label: 'Customer support',      color: '#EA580C', bg: '#FFF7ED' },
  onboarding_account:        { label: 'Onboarding & account',  color: '#2563EB', bg: '#EFF6FF' },
  other:                     { label: 'Other',                 color: '#6B7280', bg: '#F9FAFB' },
}

// Keywords for relevance filtering — covers all 10 Paytm service domains
export const RELEVANCE_KEYWORDS = [
  // Payments & UPI
  'upi', 'payment', 'transfer', 'send money', 'wallet', 'qr', 'fastag', 'toll',
  'transaction', 'deducted', 'debited', 'credited', 'refund', 'failed', 'failure',
  'not done', 'not credited', 'balance',
  // Telco
  'recharge', 'topup', 'top-up', 'top up', 'plan', 'validity', 'data pack', 'talktime',
  'prepaid', 'postpaid', 'jio', 'airtel', 'vodafone', 'vi ', 'bsnl', 'idea', 'operator',
  'broadband', 'dth', 'dish tv', 'tatasky', 'sun direct', 'landline', 'data card',
  // Utilities
  'electricity', 'bijli', 'water bill', 'gas bill', 'lpg', 'municipal', 'metro recharge',
  'education fee', 'school fee', 'college fee', 'bill pay', 'bill payment',
  // Financial Services
  'loan', 'emi', 'credit card', 'insurance', 'premium', 'buy now pay later', 'bnpl',
  'personal loan', 'merchant loan', 'paytm postpaid',
  // Wealth
  'stock', 'shares', 'mutual fund', 'mf', 'ipo', 'etf', 'gold', 'invest', 'portfolio',
  'trading', 'demat',
  // Travel
  'flight', 'train', 'bus ticket', 'hotel', 'booking', 'irctc', 'metro ticket', 'travel',
  // Commerce
  'cashback', 'offer', 'coupon', 'deal', 'gift card', 'reward', 'promo', 'discount',
  // Merchant
  'soundbox', 'pos ', 'settlement', 'merchant', 'business qr', 'payment gateway',
  // Trust & Safety
  'kyc', 'fraud', 'scam', 'blocked', 'frozen', 'restricted', 'verification', 'otp',
  'hacked', 'stolen', 'compliance',
  // Experience
  'crash', 'slow', 'loading', 'error', 'not working', 'not opening', 'login',
  'support', 'customer care',
]

/** @deprecated use RELEVANCE_KEYWORDS */
export const TELCO_KEYWORDS = RELEVANCE_KEYWORDS
