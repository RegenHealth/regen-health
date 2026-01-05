/**
 * Shopify Integration Stub
 * 
 * Future implementation will:
 * - OAuth connection flow
 * - Webhook handlers for orders/payouts
 * - Sync orders, refunds, payouts to NormalizedTransaction
 */

export const PROVIDER_NAME = 'shopify'

export async function normalizeEvent(rawEvent) {
  // TODO: Convert Shopify webhook payload to NormalizedTransaction format
  // Handle: orders/create, orders/paid, refunds/create, payouts/create
  throw new Error('Shopify integration not implemented')
}

export async function syncHistoricalData(connection) {
  // TODO: Fetch historical orders via Shopify Admin API
  throw new Error('Shopify historical sync not implemented')
}

export function getOAuthConfig() {
  return {
    authUrl: 'https://{{shop}}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{{shop}}.myshopify.com/admin/oauth/access_token',
    scopes: ['read_orders', 'read_products', 'read_shopify_payments_payouts']
  }
}
