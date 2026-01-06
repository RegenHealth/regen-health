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
        include_in_projection: true,
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
      // Default include_in_projection to true if not set
      if (result.include_in_projection === undefined) result.include_in_projection = true
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

      // Build daily aggregation - separate actual vs projected
      const dailyData = {}
      const dailyProjected = {}
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`
        dailyData[dateStr] = {}
        dailyProjected[dateStr] = {}
        profitCenters.forEach(pc => {
          dailyData[dateStr][pc.id] = 0
          dailyProjected[dateStr][pc.id] = 0
        })
      }

      transactions.forEach(txn => {
        if (dailyData[txn.txn_date] && txn.profit_center_id) {
          if (txn.is_projected) {
            dailyProjected[txn.txn_date][txn.profit_center_id] = 
              (dailyProjected[txn.txn_date][txn.profit_center_id] || 0) + txn.amount_cents
          } else {
            dailyData[txn.txn_date][txn.profit_center_id] = 
              (dailyData[txn.txn_date][txn.profit_center_id] || 0) + txn.amount_cents
          }
        }
      })

      // Calculate MTD and projections (only actual transactions count)
      const today = new Date()
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === monthNum
      const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth

      const profitCenterData = profitCenters.map(pc => {
        const company = companies.find(c => c.id === pc.company_id)
        let mtd = 0
        const dailyCells = {}
        const projectedCells = {}
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${month}-${String(day).padStart(2, '0')}`
          const actualAmount = dailyData[dateStr]?.[pc.id] || 0
          const projectedAmount = dailyProjected[dateStr]?.[pc.id] || 0
          dailyCells[dateStr] = actualAmount
          projectedCells[dateStr] = projectedAmount
          if (day <= dayOfMonth) mtd += actualAmount // Only actual counts toward MTD
        }

        const avgDaily = dayOfMonth > 0 ? mtd / dayOfMonth : 0
        const projection = isCurrentMonth ? Math.round(avgDaily * daysInMonth) : mtd

        return {
          ...pc,
          company_name: company?.name || 'Unknown',
          company_color: company?.color || '#gray',
          daily: dailyCells,
          daily_projected: projectedCells,
          mtd,
          projection
        }
      })

      // Group by company
      const companiesWithPCs = companies.map(company => ({
        ...company,
        profit_centers: profitCenterData.filter(pc => pc.company_id === company.id)
      }))

      // Calculate totals (only actual)
      const dailyTotals = {}
      const dailyProjectedTotals = {}
      let grandMtd = 0
      let grandProjection = 0
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${month}-${String(day).padStart(2, '0')}`
        dailyTotals[dateStr] = profitCenterData.reduce((sum, pc) => sum + (pc.daily[dateStr] || 0), 0)
        dailyProjectedTotals[dateStr] = profitCenterData.reduce((sum, pc) => sum + (pc.daily_projected[dateStr] || 0), 0)
      }
      grandMtd = profitCenterData.reduce((sum, pc) => sum + pc.mtd, 0)
      // Only include in projection if include_in_projection is true (default true)
      grandProjection = profitCenterData.reduce((sum, pc) => {
        const includeInProjection = pc.include_in_projection !== false
        return sum + (includeInProjection ? pc.projection : 0)
      }, 0)

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
        daily_projected_totals: dailyProjectedTotals,
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

    // ============ KANBAN COLUMNS ============
    // NEW: Single set of columns per holding account (not per profit center)
    if (route === '/kanban/columns' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const columns = await db.collection('kanban_columns')
        .find({ holding_account_id: holdingAccountId })
        .sort({ position: 1 })
        .toArray()
      const cleaned = columns.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/kanban/columns' && method === 'POST') {
      const body = await request.json()
      const count = await db.collection('kanban_columns').countDocuments({ 
        holding_account_id: body.holding_account_id
      })
      const column = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        key: body.key || `custom_${Date.now()}`,
        title: body.title || body.name,
        color: body.color || '#6b7280',
        position: body.position ?? count,
        created_at: new Date()
      }
      await db.collection('kanban_columns').insertOne(column)
      const { _id, ...result } = column
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/kanban\/columns\/[^/]+$/) && method === 'PUT') {
      const id = path[2]
      const body = await request.json()
      const update = { updated_at: new Date() }
      if (body.title) update.title = body.title
      if (body.name) update.title = body.name
      if (body.color) update.color = body.color
      if (body.position !== undefined) update.position = body.position
      await db.collection('kanban_columns').updateOne({ id }, { $set: update })
      const column = await db.collection('kanban_columns').findOne({ id })
      const { _id, ...result } = column
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/kanban\/columns\/[^/]+$/) && method === 'DELETE') {
      const id = path[2]
      const column = await db.collection('kanban_columns').findOne({ id })
      if (!column) return handleCORS(NextResponse.json({ error: 'Column not found' }, { status: 404 }))
      
      // Find previous column to move cards to
      const prevColumn = await db.collection('kanban_columns')
        .findOne({ holding_account_id: column.holding_account_id, position: { $lt: column.position } }, { sort: { position: -1 } })
      
      if (prevColumn) {
        // Move cards to previous column
        await db.collection('kanban_cards').updateMany({ column_id: id }, { $set: { column_id: prevColumn.id } })
      } else {
        // Find next column
        const nextColumn = await db.collection('kanban_columns')
          .findOne({ holding_account_id: column.holding_account_id, position: { $gt: column.position } }, { sort: { position: 1 } })
        if (nextColumn) {
          await db.collection('kanban_cards').updateMany({ column_id: id }, { $set: { column_id: nextColumn.id } })
        }
      }
      
      await db.collection('kanban_columns').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    if (route === '/kanban/columns/reorder' && method === 'POST') {
      const body = await request.json()
      const updates = body.order.map((id, index) => 
        db.collection('kanban_columns').updateOne({ id }, { $set: { position: index } })
      )
      await Promise.all(updates)
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ KANBAN CARDS ============
    // Cards belong to profit centers but use shared columns
    if (route === '/kanban/cards' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const profitCenterId = url.searchParams.get('profit_center_id')
      const companyId = url.searchParams.get('company_id')
      const columnKey = url.searchParams.get('column_key')
      const completed = url.searchParams.get('completed')
      const month = url.searchParams.get('month')
      const year = url.searchParams.get('year')
      
      const query = { holding_account_id: holdingAccountId }
      
      // Filter by profit center or company (aggregation views)
      if (profitCenterId) {
        query.profit_center_id = profitCenterId
      } else if (companyId) {
        // Get all profit centers for this company
        const pcs = await db.collection('profit_centers').find({ company_id: companyId }).toArray()
        query.profit_center_id = { $in: pcs.map(pc => pc.id) }
      }
      // If neither, return all cards (holding-wide view)
      
      if (columnKey) {
        const col = await db.collection('kanban_columns').findOne({ holding_account_id: holdingAccountId, key: columnKey })
        if (col) query.column_id = col.id
      }
      
      // Filter by completion status
      if (completed === 'true') {
        query.completed_at = { $ne: null }
        // Filter by month/year for completed tasks
        if (month && year) {
          const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
          const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
          query.completed_at = { $gte: startDate, $lte: endDate }
        } else if (year) {
          const startDate = new Date(parseInt(year), 0, 1)
          const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
          query.completed_at = { $gte: startDate, $lte: endDate }
        }
      } else if (completed === 'false') {
        query.completed_at = null
      }
      
      const cards = await db.collection('kanban_cards').find(query).sort({ display_order: 1 }).toArray()
      const cleaned = cards.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/kanban/cards' && method === 'POST') {
      const body = await request.json()
      const count = await db.collection('kanban_cards').countDocuments({ column_id: body.column_id })
      
      // Get profit center to also store company_id for filtering
      let company_id = body.company_id || null
      if (body.profit_center_id && !company_id) {
        const pc = await db.collection('profit_centers').findOne({ id: body.profit_center_id })
        if (pc) company_id = pc.company_id
      }
      
      const card = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        profit_center_id: body.profit_center_id || null,
        company_id,
        column_id: body.column_id,
        title: body.title,
        description: body.description || '',
        amount_cents: body.amount_cents || (body.amount ? Math.round(body.amount * 100) : null),
        due_date: body.due_date || null,
        assignee_user_id: body.assignee_user_id || null,
        priority: body.priority || 'medium',
        tags: body.tags || [],
        display_order: body.display_order ?? count,
        completed_at: null,
        created_at: new Date()
      }
      await db.collection('kanban_cards').insertOne(card)
      const { _id, ...result } = card
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/kanban\/cards\/[^/]+$/) && method === 'GET') {
      const id = path[2]
      const card = await db.collection('kanban_cards').findOne({ id })
      if (!card) return handleCORS(NextResponse.json({ error: 'Card not found' }, { status: 404 }))
      const { _id, ...result } = card
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/kanban\/cards\/[^/]+$/) && method === 'PUT') {
      const id = path[2]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      if (body.amount) update.amount_cents = Math.round(body.amount * 100)
      delete update.id
      delete update._id
      delete update.amount
      await db.collection('kanban_cards').updateOne({ id }, { $set: update })
      const card = await db.collection('kanban_cards').findOne({ id })
      const { _id, ...result } = card
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/kanban\/cards\/[^/]+$/) && method === 'DELETE') {
      const id = path[2]
      await db.collection('kanban_cards').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    if (route === '/kanban/cards/move' && method === 'POST') {
      const body = await request.json()
      const { card_id, column_id, new_order } = body
      
      // Check if moving to/from "finished" column to track completed_at
      const card = await db.collection('kanban_cards').findOne({ id: card_id })
      const newColumn = await db.collection('kanban_columns').findOne({ id: column_id })
      const oldColumn = card ? await db.collection('kanban_columns').findOne({ id: card.column_id }) : null
      
      const updateData = { column_id, display_order: new_order, updated_at: new Date() }
      
      // Set completed_at when moving to finished column
      if (newColumn?.key === 'finished' && oldColumn?.key !== 'finished') {
        updateData.completed_at = new Date()
      }
      // Clear completed_at when moving out of finished column
      else if (oldColumn?.key === 'finished' && newColumn?.key !== 'finished') {
        updateData.completed_at = null
      }
      
      await db.collection('kanban_cards').updateOne({ id: card_id }, { $set: updateData })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ KANBAN INIT + MIGRATION ============
    if (route === '/kanban/init' && method === 'POST') {
      const body = await request.json()
      const { holding_account_id } = body
      
      // Check if columns already exist for this holding account
      const existingCount = await db.collection('kanban_columns').countDocuments({ holding_account_id })
      
      if (existingCount === 0) {
        const defaultColumns = [
          { key: 'idea', title: 'Idea', color: '#6b7280' },
          { key: 'started', title: 'Started', color: '#3b82f6' },
          { key: 'half', title: '50% Done', color: '#f59e0b' },
          { key: 'three_quarters', title: '75% Done', color: '#8b5cf6' },
          { key: 'finished', title: 'Finished', color: '#22c55e' }
        ]
        
        const columns = defaultColumns.map((col, index) => ({
          id: uuidv4(),
          holding_account_id,
          key: col.key,
          title: col.title,
          color: col.color,
          position: index,
          created_at: new Date()
        }))
        
        await db.collection('kanban_columns').insertMany(columns)
        const cleaned = columns.map(({ _id, ...rest }) => rest)
        return handleCORS(NextResponse.json(cleaned, { status: 201 }))
      }
      
      return handleCORS(NextResponse.json({ message: 'Columns already exist' }))
    }

    // Migration endpoint to fix duplicate columns and update schema
    if (route === '/kanban/migrate' && method === 'POST') {
      const body = await request.json()
      const { holding_account_id } = body
      
      // Get all existing columns (including duplicates from old per-PC model)
      const allOldColumns = await db.collection('kanban_columns').find({ holding_account_id }).toArray()
      
      // Delete all old columns
      await db.collection('kanban_columns').deleteMany({ holding_account_id })
      
      // Create new canonical columns
      const defaultColumns = [
        { key: 'idea', title: 'Idea', color: '#6b7280' },
        { key: 'started', title: 'Started', color: '#3b82f6' },
        { key: 'half', title: '50% Done', color: '#f59e0b' },
        { key: 'three_quarters', title: '75% Done', color: '#8b5cf6' },
        { key: 'finished', title: 'Finished', color: '#22c55e' }
      ]
      
      const newColumns = defaultColumns.map((col, index) => ({
        id: uuidv4(),
        holding_account_id,
        key: col.key,
        title: col.title,
        color: col.color,
        position: index,
        created_at: new Date()
      }))
      
      await db.collection('kanban_columns').insertMany(newColumns)
      
      // Map old column names to new column keys
      const nameToKeyMap = {
        'leads': 'idea', 'lead': 'idea', 'idea': 'idea', 'ideas': 'idea',
        'in progress': 'started', 'started': 'started', 'start': 'started',
        'pending': 'half', '50% done': 'half', 'half': 'half',
        '75% done': 'three_quarters', 'three_quarters': 'three_quarters',
        'closed': 'finished', 'done': 'finished', 'finished': 'finished', 'complete': 'finished'
      }
      
      // Update all existing cards to use new column ids
      const cards = await db.collection('kanban_cards').find({ holding_account_id }).toArray()
      for (const card of cards) {
        const oldColumn = allOldColumns.find(c => c.id === card.column_id)
        if (oldColumn) {
          const oldName = (oldColumn.name || oldColumn.title || '').toLowerCase()
          const newKey = nameToKeyMap[oldName] || 'idea'
          const newColumn = newColumns.find(c => c.key === newKey)
          if (newColumn) {
            await db.collection('kanban_cards').updateOne({ id: card.id }, { $set: { column_id: newColumn.id } })
          }
        }
      }
      
      return handleCORS(NextResponse.json({ success: true, columns: newColumns.map(({ _id, ...c }) => c) }))
    }

    // ============ RESOURCES (LINKS) ============
    if (route === '/resources' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const scopeType = url.searchParams.get('scope_type')
      const scopeId = url.searchParams.get('scope_id')
      
      const query = { holding_account_id: holdingAccountId }
      if (scopeType) query.scope_type = scopeType
      if (scopeId) query.scope_id = scopeId
      
      const resources = await db.collection('resources').find(query).sort({ created_at: -1 }).toArray()
      const cleaned = resources.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/resources' && method === 'POST') {
      const body = await request.json()
      const resource = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        scope_type: body.scope_type || 'holding', // holding|company|profit_center|card
        scope_id: body.scope_id || null,
        title: body.title,
        url: body.url,
        type: body.type || 'url', // doc|url|sop|asset
        created_at: new Date(),
        created_by_user_id: body.created_by_user_id || null
      }
      await db.collection('resources').insertOne(resource)
      const { _id, ...result } = resource
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/resources\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { title: body.title, url: body.url, updated_at: new Date() }
      if (body.type) update.type = body.type
      await db.collection('resources').updateOne({ id }, { $set: update })
      const resource = await db.collection('resources').findOne({ id })
      const { _id, ...result } = resource
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/resources\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('resources').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ ROCKS (EOS QUARTERLY GOALS) ============
    if (route === '/rocks' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const companyId = url.searchParams.get('company_id')
      const profitCenterId = url.searchParams.get('profit_center_id')
      const status = url.searchParams.get('status')
      
      const query = { holding_account_id: holdingAccountId }
      if (companyId) query.company_id = companyId
      if (profitCenterId) query.profit_center_id = profitCenterId
      if (status) query.status = status
      
      const rocks = await db.collection('rocks').find(query).sort({ due_date: 1 }).toArray()
      const cleaned = rocks.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/rocks' && method === 'POST') {
      const body = await request.json()
      const rock = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        company_id: body.company_id || null,
        profit_center_id: body.profit_center_id || null,
        assignee_user_id: body.assignee_user_id,
        title: body.title,
        specific: body.specific || '',
        measurable: body.measurable || '',
        attainable: body.attainable || '',
        realistic: body.realistic || '',
        time_bound: body.time_bound || '',
        start_date: body.start_date || null,
        due_date: body.due_date,
        status: 'active',
        completed_at: null,
        created_at: new Date()
      }
      await db.collection('rocks').insertOne(rock)
      const { _id, ...result } = rock
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/rocks\/[^/]+$/) && method === 'GET') {
      const id = path[1]
      const rock = await db.collection('rocks').findOne({ id })
      if (!rock) return handleCORS(NextResponse.json({ error: 'Rock not found' }, { status: 404 }))
      const { _id, ...result } = rock
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/rocks\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { ...body, updated_at: new Date() }
      delete update.id
      delete update._id
      // Handle completion
      if (body.status === 'completed' && !body.completed_at) {
        update.completed_at = new Date()
      } else if (body.status === 'active') {
        update.completed_at = null
      }
      await db.collection('rocks').updateOne({ id }, { $set: update })
      const rock = await db.collection('rocks').findOne({ id })
      const { _id, ...result } = rock
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/rocks\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('rocks').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ============ TEAM MEMBERS ============
    if (route === '/team' && method === 'GET') {
      const holdingAccountId = url.searchParams.get('holding_account_id')
      const members = await db.collection('team_members').find({ holding_account_id: holdingAccountId }).toArray()
      const cleaned = members.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    if (route === '/team' && method === 'POST') {
      const body = await request.json()
      // Check if already exists
      const existing = await db.collection('team_members').findOne({ 
        holding_account_id: body.holding_account_id, 
        email: body.email.toLowerCase() 
      })
      if (existing) {
        return handleCORS(NextResponse.json({ error: 'Member already exists' }, { status: 400 }))
      }
      
      const member = {
        id: uuidv4(),
        holding_account_id: body.holding_account_id,
        email: body.email.toLowerCase(),
        name: body.name || '',
        role: body.role || 'member', // admin|member|viewer
        status: 'pending', // pending|active
        invited_at: new Date(),
        created_at: new Date()
      }
      await db.collection('team_members').insertOne(member)
      const { _id, ...result } = member
      return handleCORS(NextResponse.json(result, { status: 201 }))
    }

    if (route.match(/^\/team\/[^/]+$/) && method === 'PUT') {
      const id = path[1]
      const body = await request.json()
      const update = { updated_at: new Date() }
      if (body.name) update.name = body.name
      if (body.role) update.role = body.role
      if (body.status) update.status = body.status
      await db.collection('team_members').updateOne({ id }, { $set: update })
      const member = await db.collection('team_members').findOne({ id })
      const { _id, ...result } = member
      return handleCORS(NextResponse.json(result))
    }

    if (route.match(/^\/team\/[^/]+$/) && method === 'DELETE') {
      const id = path[1]
      await db.collection('team_members').deleteOne({ id })
      return handleCORS(NextResponse.json({ success: true }))
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
