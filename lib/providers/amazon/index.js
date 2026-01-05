/**
 * Amazon Integration Stub
 * 
 * Future implementation will:
 * - SP-API OAuth connection
 * - Scheduled sync of settlement reports
 * - Parse and normalize settlement data to NormalizedTransaction
 */

export const PROVIDER_NAME = 'amazon'

export async function normalizeSettlement(settlementReport) {
  // TODO: Parse Amazon settlement report and create NormalizedTransaction rows
  // Handle: ProductCharges, RefundCharges, FBA fees, etc.
  throw new Error('Amazon integration not implemented')
}

export async function syncSettlementReports(connection) {
  // TODO: Fetch settlement reports via Amazon SP-API
  throw new Error('Amazon settlement sync not implemented')
}

export function getOAuthConfig() {
  return {
    authUrl: 'https://sellercentral.amazon.com/apps/authorize/consent',
    scopes: ['sellingpartnerapi::finances']
  }
}
