/**
 * QuickBooks Online Integration Stub
 * 
 * Future implementation will:
 * - OAuth 2.0 connection
 * - Sync sales receipts, invoices, deposits
 * - Map to NormalizedTransaction using class/location rules
 */

export const PROVIDER_NAME = 'quickbooks'

export async function normalizeTransaction(qboTransaction, type) {
  // TODO: Convert QBO transaction to NormalizedTransaction
  // Handle: SalesReceipt, Invoice (when paid), Deposit
  throw new Error('QuickBooks integration not implemented')
}

export async function syncData(connection) {
  // TODO: Query QBO API for recent transactions
  throw new Error('QuickBooks sync not implemented')
}

export function getOAuthConfig() {
  return {
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: ['com.intuit.quickbooks.accounting']
  }
}
