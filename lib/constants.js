// Company color palette - distinct colors for visual differentiation
export const COMPANY_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', tint: 'bg-blue-50' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500', tint: 'bg-green-50' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500', tint: 'bg-purple-50' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500', tint: 'bg-orange-50' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500', tint: 'bg-pink-50' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500', tint: 'bg-teal-50' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500', tint: 'bg-red-50' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500', tint: 'bg-yellow-50' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', tint: 'bg-indigo-50' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', tint: 'bg-cyan-50' }
]

export const PROVIDERS = ['shopify', 'amazon', 'stripe', 'quickbooks']

export const PROVIDER_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  ERROR: 'error'
}

export const OVERHEAD_FREQUENCY = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
}

export const MATCH_TYPES = [
  'account',
  'store',
  'sku',
  'product',
  'payout',
  'memo',
  'customer',
  'class',
  'location'
]
