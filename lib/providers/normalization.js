/**
 * Normalization Service
 * 
 * This service will convert provider-specific data into NormalizedTransaction format.
 * Used when processing webhooks or syncing historical data.
 */

import * as shopify from './shopify'
import * as stripe from './stripe'
import * as amazon from './amazon'
import * as quickbooks from './quickbooks'

const providers = {
  shopify,
  stripe,
  amazon,
  quickbooks
}

export async function normalizeRawEvent(provider, rawEvent, holdingAccountId) {
  const providerModule = providers[provider]
  if (!providerModule) {
    throw new Error(`Unknown provider: ${provider}`)
  }
  
  // TODO: Implement when integrations are ready
  // const normalizedData = await providerModule.normalizeEvent(rawEvent)
  // return {
  //   holding_account_id: holdingAccountId,
  //   profit_center_id: null, // Will be mapped via rules
  //   txn_date: normalizedData.date,
  //   amount_cents: normalizedData.amountCents,
  //   currency: normalizedData.currency || 'USD',
  //   provider: provider,
  //   external_id: normalizedData.externalId,
  //   description: normalizedData.description,
  //   raw_event_id: rawEvent.id
  // }
  
  throw new Error(`Normalization for ${provider} not implemented`)
}

export async function applyMappingRules(transaction, rules) {
  // TODO: Apply mapping rules to assign profit_center_id
  // Priority order: higher priority rules checked first
  // Match types: account, store, sku, product, payout, memo, customer, class, location
  
  for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
    if (!rule.active) continue
    
    // TODO: Implement matching logic based on rule.match_type
    // if (matchesRule(transaction, rule)) {
    //   return rule.profit_center_id
    // }
  }
  
  return null // Unassigned
}

export function getProviderInfo(provider) {
  return {
    shopify: {
      name: 'Shopify',
      description: 'E-commerce platform - sync orders and payouts',
      icon: 'shopping-bag',
      color: '#96bf48'
    },
    stripe: {
      name: 'Stripe',
      description: 'Payment processor - sync charges and payouts',
      icon: 'credit-card',
      color: '#635bff'
    },
    amazon: {
      name: 'Amazon',
      description: 'Marketplace - sync settlement reports',
      icon: 'package',
      color: '#ff9900'
    },
    quickbooks: {
      name: 'QuickBooks Online',
      description: 'Accounting - sync sales and deposits',
      icon: 'calculator',
      color: '#2ca01c'
    }
  }[provider]
}
