/**
 * Stripe Integration Stub
 * 
 * Future implementation will:
 * - OAuth/API key connection
 * - Webhook handlers for charges, balance transactions, payouts
 * - Sync to NormalizedTransaction
 */

export const PROVIDER_NAME = 'stripe'

export async function normalizeEvent(rawEvent) {
  // TODO: Convert Stripe webhook to NormalizedTransaction
  // Handle: charge.succeeded, balance.available, payout.paid
  throw new Error('Stripe integration not implemented')
}

export async function syncHistoricalData(connection) {
  // TODO: Fetch historical charges/payouts via Stripe API
  throw new Error('Stripe historical sync not implemented')
}

export function getWebhookEvents() {
  return [
    'charge.succeeded',
    'charge.refunded',
    'payout.paid',
    'balance.available'
  ]
}
