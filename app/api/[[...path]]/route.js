import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method
  const url = new URL(request.url)

  try {
    const db = await connectToMongo()

    // ============ HEALTH CHECK ============
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Fishing Poles Dashboard API', status: 'healthy' }))
    }

    // ============ HOLDING ACCOUNTS ============
    if (route === '/holding-accounts' && method === 'GET') {
      const accounts = await db.collection('holding_accounts').find({}).toArray()
      const cleaned = accounts.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/holding-accounts' && method === 'POST') {
      const body = await request.json()
      const account = {
        id: uuidv4(),
        name: body.name || 'My Business',
        created_at: new Date(),
        updated_at: new Date()
      }
      await db.collection('holding_accounts').insertOne(account)
      const { _id, ...result } = account
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    // Get single holding account
    if (route.match(/^\/holding-accounts\/[^/]+$/) && method === 'GET') {
      const id = path[1]
      const account = await db.collection('holding_accounts').findOne({ id })
      if (!account) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...result } = account
      return handleCORS(NextResponse.json(result))
    }

    // Update holding account
    if (route.match(/^\/holding-accounts\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { name: body.name, updated_at: new Date() }
      await db.collection('holding_accounts').updateOne({ id }, { $set: update })
      const account = await db.collection('holding_accounts').findOne({ id })
      const { _id, ...result } = account
      return handleCORS(NextResponse.json(result))
    }

    // ============ COMPANIES ============
    if (route === '/companies' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const query = holdingAccountId ? { holding_account_id: holdingAccountId } : {}
      const companies = await db.collection('companies').find(query).sort({ display_order: 1 }).toArray()
      const cleaned = companies.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/companies' && method === 'POST') {
      const body = await request.json()
      const count = await db.collection('companies').countDocuments({ holding_account_id: body.holding_account_id })
      const company = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        name: body.name,
        color: body.color || '#3b82f6',
        display_order: body.display_order ?? count,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
      await db.collection('companies').insertOne(company)
      const { _id, ...result } = company
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/companies\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      delete update.id
      delete update._id
      await db.collection('companies').updateOne({ id }, { $set: update })
      const company = await db.collection('companies').findOne({ id })
      const { _id, ...result } = company
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/companies\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('companies').updateOne({ id }, { $set: { active: false, updated_at: new Date() } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Batch reorder companies
    if (route === '/companies/reorder' && method === 'POST') {
      const body = await request.json()
      const updates = body.order.map((id, index) => 
        db.collection('companies').updateOne({ id }, { $set: { display_order: index, updated_at: new Date() } })
      )
      await Promise.all(updates)
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ PROFIT CENTERS ============
    if (route === '/profit-centers' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const companyId = url.searchParams.get('company_id')
      const query = {}
      if (holdingAccountId) query.holding_account_id = holdingAccountId
      if (companyId) query.company_id = companyId
      const profitCenters = await db.collection('profit_centers').find(query).sort({ display_order: 1 }).toArray()
      const cleaned = profitCenters.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/profit-centers' && method === 'POST') {
      const body = await request.json()
      const count = await db.collection('profit_centers').countDocuments({ company_id: body.company_id })
      const profitCenter = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        company_id: body.company_id,
        name: body.name,
        display_order: body.display_order ?? count,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
      await db.collection('profit_centers').insertOne(profitCenter)
      const { _id, ...result } = profitCenter
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/profit-centers\/[^/]+$/) && method === 'GET') {
      const id = path[1]
      const pc = await db.collection('profit_centers').findOne({ id })
      if (!pc) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...result } = pc
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/profit-centers\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      delete update.id
      delete update._id
      await db.collection('profit_centers').updateOne({ id }, { $set: update })
      const pc = await db.collection('profit_centers').findOne({ id })
      const { _id, ...result } = pc
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/profit-centers\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('profit_centers').updateOne({ id }, { $set: { active: false, updated_at: new Date() } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ TRANSACTIONS ============
    if (route === '/transactions' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const profitCenterId = url.searchParams.get('profit_center_id')
      const month = url.searchParams.get('month') // YYYY-MM format
      const query = {}
      if (holdingAccountId) query.holding_account_id = holdingAccountId
      if (profitCenterId) query.profit_center_id = profitCenterId
      if (month) {
        const [year, monthNum] = month.split('-').map(Number)
        const startDate = new Date(year, monthNum - 1, 1)
        const endDate = new Date(year, monthNum, 0)
        query.txn_date = {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      }
      const transactions = await db.collection('normalized_transactions').find(query).sort({ txn_date: -1 }).toArray()
      const cleaned = transactions.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/transactions' && method === 'POST') {
      const body = await request.json()
      const transaction = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        profit_center_id: body.profit_center_id,
        company_id: body.company_id,
        txn_date: body.txn_date,
        amount_cents: Math.round(body.amount_cents || body.amount * 100),
        currency: body.currency || 'USD',
        provider: body.provider || 'manual',
        external_id: body.external_id || null,
        description: body.description || '',
        raw_event_id: body.raw_event_id || null,
        is_projected: body.is_projected || false,
        created_at: new Date()
      }
      await db.collection('normalized_transactions').insertOne(transaction)
      const { _id, ...result } = transaction
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/transactions\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      if (body.amount) update.amount_cents = Math.round(body.amount * 100)
      delete update.id
      delete update._id
      delete update.amount
      await db.collection('normalized_transactions').updateOne({ id }, { $set: update })
      const txn = await db.collection('normalized_transactions').findOne({ id })
      const { _id, ...result } = txn
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/transactions\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('normalized_transactions').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ DASHBOARD DATA ============
    if (route === '/dashboard' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const month = url.searchParams.get('month') // YYYY-MM format
      
      if (!holdingAccountId || !month) {
        return handleCORS(NextResponse.json({ error: 'holding_account_id and month required' }, { status: 400 }))
      }

      const [year, monthNum] = month.split('-').map(Number)
      const daysInMonth = new Date(year, monthNum, 0).getDate()
      const startDate = `${month}-01`
      const endDate = `${month}-${String(daysInMonth).padStart(2, '0')}`

      // Get companies and profit centers
      const companies = await db.collection('companies')
        .find({ holding_account_id: holdingAccountId, active: { $ne: false } })
        .sort({ display_order: 1 })
        .toArray()
      
      const profitCenters = await db.collection('profit_centers')
        .find({ holding_account_id: holdingAccountId, active: { $ne: false } })
        .sort({ display_order: 1 })
        .toArray()

      // Get transactions for the month
      const transactions = await db.collection('normalized_transactions')
        .find({
          holding_account_id: holdingAccountId,
          txn_date: { $gte: startDate, $lte: endDate }
        })
        .toArray()

      // Build daily aggregation
      const dailyData = {}
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`
        dailyData[dateStr] = {}
        profitCenters.forEach(pc => {
          dailyData[dateStr][pc.id] = 0
        })
      }

      transactions.forEach(txn => {
        if (dailyData[txn.txn_date] && txn.profit_center_id) {
          dailyData[txn.txn_date][txn.profit_center_id] = 
            (dailyData[txn.txn_date][txn.profit_center_id] || 0) + txn.amount_cents
        }
      })

      // Calculate MTD and projections
      const today = new Date()
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === monthNum
      const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth

      const profitCenterData = profitCenters.map(pc => {
        const company = companies.find(c => c.id === pc.company_id)
        let mtd = 0
        const dailyCells = {}
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${month}-${String(day).padStart(2, '0')}`
          const amount = dailyData[dateStr]?.[pc.id] || 0
          dailyCells[dateStr] = amount
          if (day <= dayOfMonth) mtd += amount
        }

        const avgDaily = dayOfMonth > 0 ? mtd / dayOfMonth : 0
        const projection = isCurrentMonth ? Math.round(avgDaily * daysInMonth) : mtd

        return {
          ...pc,
          company_name: company?.name || 'Unknown',
          company_color: company?.color || '#gray',
          daily: dailyCells,
          mtd,
          projection
        }
      })

      // Group by company
      const companiesWithPCs = companies.map(company => ({
        ...company,
        profit_centers: profitCenterData.filter(pc => pc.company_id === company.id)
      }))

      // Calculate totals
      const dailyTotals = {}
      let grandMtd = 0
      let grandProjection = 0
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`
        dailyTotals[dateStr] = profitCenterData.reduce((sum, pc) => sum + (pc.daily[dateStr] || 0), 0)
      }
      grandMtd = profitCenterData.reduce((sum, pc) => sum + pc.mtd, 0)
      grandProjection = profitCenterData.reduce((sum, pc) => sum + pc.projection, 0)

      const result = {
        month,
        days_in_month: daysInMonth,
        day_of_month: dayOfMonth,
        is_current_month: isCurrentMonth,
        companies: companiesWithPCs.map(({ _id, ...c }) => ({
          ...c,
          profit_centers: c.profit_centers.map(({ _id, ...pc }) => pc)
        })),
        profit_centers: profitCenterData.map(({ _id, ...pc }) => pc),
        daily_totals: dailyTotals,
        grand_mtd: grandMtd,
        grand_projection: grandProjection
      }

      return handleCORS(NextResponse.json(result))
    }

    // ============ NOTES ============
    if (route === '/notes' && method === 'GET') {
      const profitCenterId = url.searchParams.get('profit_center_id')
      const query = profitCenterId ? { profit_center_id: profitCenterId } : {}
      const notes = await db.collection('note_entries').find(query).sort({ created_at: -1 }).toArray()
      const cleaned = notes.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/notes' && method === 'POST') {
      const body = await request.json()
      const note = {
        id: uuidv4(),
        profit_center_id: body.profit_center_id,
        text: body.text,
        created_at: new Date(),
        created_by: body.created_by || 'user'
      }
      await db.collection('note_entries').insertOne(note)
      const { _id, ...result } = note
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/notes\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('note_entries').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ OVERHEAD ============
    if (route === '/overhead' && method === 'GET') {
      const profitCenterId = url.searchParams.get('profit_center_id')
      const query = profitCenterId ? { profit_center_id: profitCenterId } : {}
      const items = await db.collection('overhead_items').find(query).sort({ created_at: -1 }).toArray()
      const cleaned = items.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/overhead' && method === 'POST') {
      const body = await request.json()
      const item = {
        id: uuidv4(),
        profit_center_id: body.profit_center_id,
        name: body.name,
        amount_cents: Math.round(body.amount_cents || body.amount * 100),
        frequency: body.frequency || 'monthly',
        note: body.note || '',
        created_at: new Date()
      }
      await db.collection('overhead_items').insertOne(item)
      const { _id, ...result } = item
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/overhead\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      if (body.amount) update.amount_cents = Math.round(body.amount * 100)
      delete update.id
      delete update._id
      delete update.amount
      await db.collection('overhead_items').updateOne({ id }, { $set: update })
      const item = await db.collection('overhead_items').findOne({ id })
      const { _id, ...result } = item
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/overhead\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('overhead_items').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ FINANCIAL CONNECTIONS (Stubs) ============
    if (route === '/connections' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const query = holdingAccountId ? { holding_account_id: holdingAccountId } : {}
      const connections = await db.collection('financial_connections').find(query).toArray()
      const cleaned = connections.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/connections' && method === 'POST') {
      const body = await request.json()
      const connection = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        provider: body.provider, // shopify | amazon | stripe | quickbooks
        status: 'disconnected',
        external_account_id: null,
        metadata: {},
        last_synced_at: null,
        created_at: new Date()
      }
      await db.collection('financial_connections').insertOne(connection)
      const { _id, ...result } = connection
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    // ============ MAPPING RULES (Stubs) ============
    if (route === '/mapping-rules' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const query = holdingAccountId ? { holding_account_id: holdingAccountId } : {}
      const rules = await db.collection('mapping_rules').find(query).sort({ priority: -1 }).toArray()
      const cleaned = rules.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/mapping-rules' && method === 'POST') {
      const body = await request.json()
      const rule = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        provider: body.provider,
        match_type: body.match_type,
        match_value: body.match_value,
        profit_center_id: body.profit_center_id,
        priority: body.priority || 0,
        active: true,
        created_at: new Date()
      }
      await db.collection('mapping_rules').insertOne(rule)
      const { _id, ...result } = rule
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
