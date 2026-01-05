# Fishing Poles Dashboard

A multi-tenant revenue tracking dashboard for managing multiple businesses and profit centers on one screen. Built with architecture ready for future integrations with Shopify, Amazon, Stripe, and QuickBooks Online.

## Features

### MVP Features (Implemented)
- **Revenue Dashboard**: Daily revenue grid with profit centers as rows and days as columns
- **Company Color Coding**: Each company has a distinct color with left border and subtle tint
- **MTD & Projection**: Month-to-date totals and run-rate projections
- **Manual Transactions**: Add, edit, delete transactions via modal
- **Profit Center Detail**: Drill-down pages with tabs for Transactions, Notes, and Overhead
- **Notes/Pass-Down Log**: Timestamped notes for each profit center
- **Overhead Tracking**: Monthly/annual overhead items per profit center
- **Settings Management**: Create/edit companies and profit centers
- **Connections UI**: Stub page showing Shopify, Stripe, Amazon, QuickBooks (Coming Soon)

### Calculation Rules
- **Cell Value**: Sum of all transactions for a profit center on a specific day
- **MTD Total**: Sum of daily amounts up to the current date (or full month for past months)
- **Projection**: `(MTD Total / day_of_month) × days_in_month` for current month
- **Totals Row**: Sum of all profit centers per day

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Database**: MongoDB (adaptable to PostgreSQL/Supabase)
- **Date Handling**: date-fns
- **IDs**: UUIDs (uuid v4)

## Data Model

### Core Entities

```
HoldingAccount
├── id (UUID)
├── name
└── created_at

Company
├── id (UUID)
├── holding_account_id (FK)
├── name
├── color (hex)
├── display_order
└── active

ProfitCenter
├── id (UUID)
├── holding_account_id (FK)
├── company_id (FK)
├── name
├── display_order
└── active
```

### Financial Data (Integration-Ready)

```
NormalizedTransaction
├── id (UUID)
├── holding_account_id (FK)
├── profit_center_id (FK, nullable for unmapped)
├── company_id (FK, denormalized)
├── txn_date (YYYY-MM-DD string)
├── amount_cents (integer)
├── currency (default: USD)
├── provider (enum: manual | shopify | amazon | stripe | quickbooks)
├── external_id (nullable, for idempotency)
├── description
├── raw_event_id (FK, nullable)
└── created_at

FinancialConnection
├── id (UUID)
├── holding_account_id (FK)
├── provider (enum: shopify | amazon | stripe | quickbooks)
├── status (enum: disconnected | connected | error)
├── external_account_id
├── metadata (JSON)
└── last_synced_at

RawEvent
├── id (UUID)
├── financial_connection_id (FK)
├── external_event_id
├── event_type
├── occurred_at
├── payload (JSON)
├── received_at
└── UNIQUE(provider, external_event_id)

ProfitCenterMappingRule
├── id (UUID)
├── holding_account_id (FK)
├── provider
├── match_type (enum: account | store | sku | product | payout | memo | customer | class | location)
├── match_value
├── profit_center_id (FK)
├── priority
└── active
```

### Supporting Entities

```
OverheadItem
├── id (UUID)
├── profit_center_id (FK)
├── name
├── amount_cents
├── frequency (enum: monthly | annual)
└── note

NoteEntry
├── id (UUID)
├── profit_center_id (FK)
├── text
├── created_at
└── created_by
```

## Project Structure

```
/app
├── app/
│   ├── api/[[...path]]/
│   │   └── route.js          # All API routes
│   ├── page.js               # Main dashboard + views
│   ├── layout.js             # Root layout
│   └── globals.css           # Global styles
├── lib/
│   ├── db.js                 # MongoDB connection helper
│   ├── constants.js          # Colors, providers, enums
│   └── providers/            # Integration stubs
│       ├── shopify/index.js
│       ├── stripe/index.js
│       ├── amazon/index.js
│       ├── quickbooks/index.js
│       └── normalization.js  # Normalization service
├── components/ui/            # shadcn components
└── package.json
```

## API Endpoints

### Holding Accounts
- `GET /api/holding-accounts` - List all accounts
- `POST /api/holding-accounts` - Create account
- `GET /api/holding-accounts/:id` - Get single account

### Companies
- `GET /api/companies?holding_account_id=xxx` - List companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Archive company

### Profit Centers
- `GET /api/profit-centers?holding_account_id=xxx&company_id=xxx` - List
- `POST /api/profit-centers` - Create
- `GET /api/profit-centers/:id` - Get single
- `PUT /api/profit-centers/:id` - Update
- `DELETE /api/profit-centers/:id` - Archive

### Transactions
- `GET /api/transactions?holding_account_id=xxx&profit_center_id=xxx&month=YYYY-MM`
- `POST /api/transactions` - Create
- `PUT /api/transactions/:id` - Update
- `DELETE /api/transactions/:id` - Delete

### Dashboard
- `GET /api/dashboard?holding_account_id=xxx&month=YYYY-MM` - Get aggregated dashboard data

### Notes
- `GET /api/notes?profit_center_id=xxx` - List notes
- `POST /api/notes` - Create note
- `DELETE /api/notes/:id` - Delete note

### Overhead
- `GET /api/overhead?profit_center_id=xxx` - List items
- `POST /api/overhead` - Create item
- `PUT /api/overhead/:id` - Update item
- `DELETE /api/overhead/:id` - Delete item

### Connections (Stub)
- `GET /api/connections?holding_account_id=xxx` - List connections
- `POST /api/connections` - Create connection stub

### Mapping Rules (Stub)
- `GET /api/mapping-rules?holding_account_id=xxx` - List rules
- `POST /api/mapping-rules` - Create rule

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Yarn package manager

### Setup

```bash
# Clone and install
cd /app
yarn install

# Configure environment
# Edit .env with your MongoDB URL
MONGO_URL=mongodb://localhost:27017
DB_NAME=fishing_poles_dashboard

# Start development server
yarn dev
```

The app will be available at http://localhost:3000

## Testing the MVP

### Acceptance Tests

1. **Create Holding Account**
   - Open the app, enter a name, click "Create Account"

2. **Add Companies & Profit Centers**
   - Go to Settings
   - Add 3 companies with different colors
   - Add profit centers under each company

3. **Add Manual Transactions**
   - Click "Add Transaction" on the dashboard
   - Select a profit center, enter date, amount, description
   - Verify the cell updates with the correct amount

4. **Verify Totals**
   - Row MTD and Projection columns show correct calculations
   - Bottom totals row sums all profit centers

5. **Drill-Down**
   - Click on a profit center row
   - View Transactions tab with all transactions
   - Add/view Notes in Notes tab
   - Add/view Overhead items in Overhead tab

## Next Iterations

### Phase 1: OAuth for Providers
- Implement OAuth flows for Shopify, Stripe, Amazon SP-API, QuickBooks
- Store tokens securely
- Enable connect buttons on Connections page

### Phase 2: Webhook Ingestion
- Set up webhook endpoints for Stripe and Shopify
- Create RawEvent entries from webhooks
- Trigger normalization pipeline

### Phase 3: Scheduled Sync Jobs
- Implement scheduled jobs for Amazon settlement reports
- QuickBooks API polling for new transactions
- Backfill historical data

### Phase 4: Mapping Rules UI
- Build UI to create/edit mapping rules
- Preview matching before saving
- Auto-assign profit_center_id to transactions

### Phase 5: Refunds & Expenses
- Support negative amounts (refunds)
- Expense tracking
- Net revenue calculations

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGO_URL | MongoDB connection string | Yes |
| DB_NAME | Database name | Yes |
| NEXT_PUBLIC_BASE_URL | Public URL for the app | Yes |
| CORS_ORIGINS | Allowed CORS origins | No |

## Provider Integration Structure

Each provider in `/lib/providers/` includes:
- `normalizeEvent()` - Convert provider data to NormalizedTransaction
- `syncHistoricalData()` - Fetch and import historical data
- `getOAuthConfig()` / `getWebhookEvents()` - OAuth and webhook config

The `normalization.js` service coordinates:
- `normalizeRawEvent()` - Process raw events from any provider
- `applyMappingRules()` - Auto-assign profit centers
- `getProviderInfo()` - Provider metadata for UI

## License

MIT
