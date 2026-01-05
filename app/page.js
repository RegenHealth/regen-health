'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Plus, Settings, Building2, DollarSign, TrendingUp, Calendar, ArrowLeft, Trash2, Edit, ShoppingBag, CreditCard, Package, Calculator, Link2 } from 'lucide-react'

const COMPANY_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' }
]

const PROVIDERS = [
  { id: 'shopify', name: 'Shopify', icon: ShoppingBag, color: '#96bf48', description: 'E-commerce orders & payouts' },
  { id: 'stripe', name: 'Stripe', icon: CreditCard, color: '#635bff', description: 'Charges & balance transactions' },
  { id: 'amazon', name: 'Amazon', icon: Package, color: '#ff9900', description: 'Settlement reports' },
  { id: 'quickbooks', name: 'QuickBooks', icon: Calculator, color: '#2ca01c', description: 'Sales receipts & invoices' }
]

function formatCents(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function getColorTint(hexColor) {
  return hexColor + '15'
}

// ============ DASHBOARD VIEW ============
function DashboardView({ holdingAccountId, onSelectProfitCenter, onNavigate }) {
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()))
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addTxnOpen, setAddTxnOpen] = useState(false)
  const [txnForm, setTxnForm] = useState({ profit_center_id: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const monthStr = format(selectedMonth, 'yyyy-MM')
      const res = await fetch(`/api/dashboard?holding_account_id=${holdingAccountId}&month=${monthStr}`)
      const data = await res.json()
      setDashboardData(data)
    } catch (e) {
      console.error('Failed to fetch dashboard:', e)
    }
    setLoading(false)
  }, [holdingAccountId, selectedMonth])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1))
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1))
  const handleToday = () => setSelectedMonth(startOfMonth(new Date()))

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    const pc = dashboardData?.profit_centers?.find(p => p.id === txnForm.profit_center_id)
    if (!pc) return

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holding_account_id: holdingAccountId,
        profit_center_id: txnForm.profit_center_id,
        company_id: pc.company_id,
        txn_date: txnForm.date,
        amount: parseFloat(txnForm.amount),
        description: txnForm.description,
        provider: 'manual'
      })
    })
    setAddTxnOpen(false)
    setTxnForm({ profit_center_id: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })
    fetchDashboard()
  }

  if (loading && !dashboardData) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  const daysInMonth = dashboardData?.days_in_month || getDaysInMonth(selectedMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1)
    return { date: format(d, 'yyyy-MM-dd'), day: i + 1, dow: format(d, 'EEE'), isToday: isToday(d) }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-lg font-semibold min-w-[140px] text-center">{format(selectedMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={handleToday} className="ml-2"><Calendar className="h-4 w-4 mr-2" />Today</Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addTxnOpen} onOpenChange={setAddTxnOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Manual Transaction</DialogTitle></DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <Label>Profit Center</Label>
                  <Select value={txnForm.profit_center_id} onValueChange={(v) => setTxnForm({...txnForm, profit_center_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select profit center" /></SelectTrigger>
                    <SelectContent>
                      {dashboardData?.companies?.map(company => (
                        company.profit_centers?.map(pc => (
                          <SelectItem key={pc.id} value={pc.id}>
                            <span style={{ color: company.color }}>{company.name}</span> / {pc.name}
                          </SelectItem>
                        ))
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={txnForm.date} onChange={(e) => setTxnForm({...txnForm, date: e.target.value})} />
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={txnForm.amount} onChange={(e) => setTxnForm({...txnForm, amount: e.target.value})} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Payment from customer..." value={txnForm.description} onChange={(e) => setTxnForm({...txnForm, description: e.target.value})} />
                </div>
                <Button type="submit" className="w-full" disabled={!txnForm.profit_center_id || !txnForm.amount}>Add Transaction</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => onNavigate('settings')}><Settings className="h-4 w-4 mr-2" />Settings</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MTD Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCents(dashboardData?.grand_mtd || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projected Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{formatCents(dashboardData?.grand_projection || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Companies / Profit Centers</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{dashboardData?.companies?.length || 0} / {dashboardData?.profit_centers?.length || 0}</div></CardContent>
        </Card>
      </div>

      {/* Revenue Grid */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="min-w-max">
              {/* Header Row */}
              <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                <div className="w-[200px] min-w-[200px] p-3 font-semibold border-r bg-muted">Profit Center</div>
                {days.map(d => (
                  <div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-xs border-r ${d.isToday ? 'bg-primary/10 font-bold' : ''}`}>
                    <div className="text-muted-foreground">{d.dow}</div>
                    <div>{d.day}</div>
                  </div>
                ))}
                <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold border-r bg-muted">MTD</div>
                <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold bg-muted">Projection</div>
              </div>

              {/* Company Groups */}
              {dashboardData?.companies?.map(company => (
                <div key={company.id}>
                  {/* Company Header */}
                  <div className="flex border-b" style={{ backgroundColor: getColorTint(company.color) }}>
                    <div className="w-[200px] min-w-[200px] p-2 font-semibold flex items-center gap-2 border-r">
                      <div className="w-3 h-full min-h-[24px] rounded" style={{ backgroundColor: company.color }}></div>
                      <Building2 className="h-4 w-4" style={{ color: company.color }} />
                      <span>{company.name}</span>
                    </div>
                    {days.map(d => <div key={d.date} className="w-[80px] min-w-[80px] border-r"></div>)}
                    <div className="w-[100px] min-w-[100px] border-r"></div>
                    <div className="w-[100px] min-w-[100px]"></div>
                  </div>

                  {/* Profit Center Rows */}
                  {company.profit_centers?.map(pc => (
                    <div key={pc.id} className="flex border-b hover:bg-muted/50 cursor-pointer group" onClick={() => onSelectProfitCenter(pc.id)}>
                      <div className="w-[200px] min-w-[200px] p-2 pl-6 flex items-center gap-2 border-r">
                        <div className="w-1 h-6 rounded" style={{ backgroundColor: company.color }}></div>
                        <span className="truncate group-hover:underline">{pc.name}</span>
                      </div>
                      {days.map(d => {
                        const amount = pc.daily?.[d.date] || 0
                        return (
                          <div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-sm border-r ${d.isToday ? 'bg-primary/5' : ''} ${amount > 0 ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}>
                            {amount > 0 ? formatCents(amount) : '-'}
                          </div>
                        )
                      })}
                      <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold text-green-700 border-r">{formatCents(pc.mtd)}</div>
                      <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold text-blue-700">{formatCents(pc.projection)}</div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Totals Row */}
              <div className="flex border-t-2 border-primary bg-muted font-bold sticky bottom-0">
                <div className="w-[200px] min-w-[200px] p-3 border-r">TOTALS</div>
                {days.map(d => {
                  const total = dashboardData?.daily_totals?.[d.date] || 0
                  return (
                    <div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-sm border-r ${d.isToday ? 'bg-primary/10' : ''} ${total > 0 ? 'text-green-700' : ''}`}>
                      {total > 0 ? formatCents(total) : '-'}
                    </div>
                  )
                })}
                <div className="w-[100px] min-w-[100px] p-2 text-center text-green-700 border-r">{formatCents(dashboardData?.grand_mtd || 0)}</div>
                <div className="w-[100px] min-w-[100px] p-2 text-center text-blue-700">{formatCents(dashboardData?.grand_projection || 0)}</div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {(!dashboardData?.companies || dashboardData.companies.length === 0) && (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first company and profit centers in Settings.</p>
          <Button onClick={() => onNavigate('settings')}><Plus className="h-4 w-4 mr-2" />Add Company</Button>
        </Card>
      )}
    </div>
  )
}

// ============ PROFIT CENTER DETAIL VIEW ============
function ProfitCenterDetail({ profitCenterId, holdingAccountId, onBack }) {
  const [profitCenter, setProfitCenter] = useState(null)
  const [company, setCompany] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [notes, setNotes] = useState([])
  const [overhead, setOverhead] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newOverhead, setNewOverhead] = useState({ name: '', amount: '', frequency: 'monthly', note: '' })
  const [editTxn, setEditTxn] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pcRes, txnRes, notesRes, ohRes] = await Promise.all([
        fetch(`/api/profit-centers/${profitCenterId}`),
        fetch(`/api/transactions?profit_center_id=${profitCenterId}`),
        fetch(`/api/notes?profit_center_id=${profitCenterId}`),
        fetch(`/api/overhead?profit_center_id=${profitCenterId}`)
      ])
      const pcData = await pcRes.json()
      setProfitCenter(pcData)
      setTransactions(await txnRes.json())
      setNotes(await notesRes.json())
      setOverhead(await ohRes.json())
      
      if (pcData.company_id) {
        const compRes = await fetch(`/api/companies?holding_account_id=${holdingAccountId}`)
        const companies = await compRes.json()
        setCompany(companies.find(c => c.id === pcData.company_id))
      }
    } catch (e) {
      console.error('Failed to fetch profit center data:', e)
    }
    setLoading(false)
  }, [profitCenterId, holdingAccountId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profit_center_id: profitCenterId, text: newNote })
    })
    setNewNote('')
    fetchData()
  }

  const handleDeleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddOverhead = async (e) => {
    e.preventDefault()
    await fetch('/api/overhead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profit_center_id: profitCenterId, ...newOverhead, amount: parseFloat(newOverhead.amount) })
    })
    setNewOverhead({ name: '', amount: '', frequency: 'monthly', note: '' })
    fetchData()
  }

  const handleDeleteOverhead = async (id) => {
    await fetch(`/api/overhead/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleDeleteTransaction = async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleUpdateTransaction = async (e) => {
    e.preventDefault()
    await fetch(`/api/transactions/${editTxn.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txn_date: editTxn.txn_date, amount: parseFloat(editTxn.amount), description: editTxn.description })
    })
    setEditTxn(null)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
        <div className="flex items-center gap-2">
          {company && <div className="w-3 h-6 rounded" style={{ backgroundColor: company.color }}></div>}
          <h1 className="text-2xl font-bold">{profitCenter?.name}</h1>
          {company && <Badge variant="outline" style={{ borderColor: company.color, color: company.color }}>{company.name}</Badge>}
        </div>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="overhead">Overhead ({overhead.length})</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet. Add one from the dashboard.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-24">{txn.txn_date}</div>
                        <div className="font-semibold text-green-700 w-24">{formatCents(txn.amount_cents)}</div>
                        <Badge variant="outline">{txn.provider}</Badge>
                        <div className="text-sm">{txn.description || '-'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditTxn({ ...txn, amount: txn.amount_cents / 100 })}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(txn.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Transaction Dialog */}
          {editTxn && (
            <Dialog open={!!editTxn} onOpenChange={() => setEditTxn(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateTransaction} className="space-y-4">
                  <div><Label>Date</Label><Input type="date" value={editTxn.txn_date} onChange={(e) => setEditTxn({...editTxn, txn_date: e.target.value})} /></div>
                  <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={editTxn.amount} onChange={(e) => setEditTxn({...editTxn, amount: e.target.value})} /></div>
                  <div><Label>Description</Label><Input value={editTxn.description} onChange={(e) => setEditTxn({...editTxn, description: e.target.value})} /></div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader><CardTitle>Notes / Pass-Down Log</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" />
                <Button type="submit" disabled={!newNote.trim()}>Add Note</Button>
              </form>
              <Separator />
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                      <p className="whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overhead Tab */}
        <TabsContent value="overhead">
          <Card>
            <CardHeader><CardTitle>Overhead Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddOverhead} className="grid grid-cols-5 gap-2">
                <Input placeholder="Name" value={newOverhead.name} onChange={(e) => setNewOverhead({...newOverhead, name: e.target.value})} />
                <Input type="number" step="0.01" placeholder="Amount" value={newOverhead.amount} onChange={(e) => setNewOverhead({...newOverhead, amount: e.target.value})} />
                <Select value={newOverhead.frequency} onValueChange={(v) => setNewOverhead({...newOverhead, frequency: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Note" value={newOverhead.note} onChange={(e) => setNewOverhead({...newOverhead, note: e.target.value})} />
                <Button type="submit" disabled={!newOverhead.name || !newOverhead.amount}>Add</Button>
              </form>
              <Separator />
              {overhead.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No overhead items yet.</p>
              ) : (
                <div className="space-y-2">
                  {overhead.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-red-600 font-semibold">{formatCents(item.amount_cents)}</div>
                        <Badge variant="outline">{item.frequency}</Badge>
                        {item.note && <span className="text-sm text-muted-foreground">{item.note}</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteOverhead(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ SETTINGS VIEW ============
function SettingsView({ holdingAccountId, onBack }) {
  const [companies, setCompanies] = useState([])
  const [profitCenters, setProfitCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCompany, setNewCompany] = useState({ name: '', color: COMPANY_COLORS[0].value })
  const [newPC, setNewPC] = useState({ company_id: '', name: '' })
  const [editCompany, setEditCompany] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [compRes, pcRes] = await Promise.all([
      fetch(`/api/companies?holding_account_id=${holdingAccountId}`),
      fetch(`/api/profit-centers?holding_account_id=${holdingAccountId}`)
    ])
    setCompanies(await compRes.json())
    setProfitCenters(await pcRes.json())
    setLoading(false)
  }, [holdingAccountId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddCompany = async (e) => {
    e.preventDefault()
    await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, ...newCompany })
    })
    setNewCompany({ name: '', color: COMPANY_COLORS[companies.length % COMPANY_COLORS.length].value })
    fetchData()
  }

  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    await fetch(`/api/companies/${editCompany.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editCompany.name, color: editCompany.color })
    })
    setEditCompany(null)
    fetchData()
  }

  const handleDeleteCompany = async (id) => {
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddProfitCenter = async (e) => {
    e.preventDefault()
    await fetch('/api/profit-centers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, ...newPC })
    })
    setNewPC({ company_id: '', name: '' })
    fetchData()
  }

  const handleDeleteProfitCenter = async (id) => {
    await fetch(`/api/profit-centers/${id}`, { method: 'DELETE' })
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies & Profit Centers</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-6">
          {/* Add Company */}
          <Card>
            <CardHeader><CardTitle>Add Company</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddCompany} className="flex gap-4">
                <Input placeholder="Company name" value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} className="flex-1" />
                <Select value={newCompany.color} onValueChange={(v) => setNewCompany({...newCompany, color: v})}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: newCompany.color }}></div>
                      <span>{COMPANY_COLORS.find(c => c.value === newCompany.color)?.name}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_COLORS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div>
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={!newCompany.name}><Plus className="h-4 w-4 mr-2" />Add Company</Button>
              </form>
            </CardContent>
          </Card>

          {/* Companies List */}
          {companies.filter(c => c.active !== false).map(company => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-8 rounded" style={{ backgroundColor: company.color }}></div>
                    <CardTitle>{company.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditCompany(company)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCompany(company.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Profit Center */}
                <form onSubmit={handleAddProfitCenter} className="flex gap-2">
                  <Input placeholder="Profit center name" value={newPC.company_id === company.id ? newPC.name : ''} onChange={(e) => setNewPC({ company_id: company.id, name: e.target.value })} className="flex-1" />
                  <Button type="submit" disabled={newPC.company_id !== company.id || !newPC.name}><Plus className="h-4 w-4 mr-2" />Add</Button>
                </form>

                {/* Profit Centers List */}
                <div className="space-y-2">
                  {profitCenters.filter(pc => pc.company_id === company.id && pc.active !== false).map(pc => (
                    <div key={pc.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: company.color }}></div>
                        <span>{pc.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProfitCenter(pc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Edit Company Dialog */}
          {editCompany && (
            <Dialog open={!!editCompany} onOpenChange={() => setEditCompany(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateCompany} className="space-y-4">
                  <div><Label>Name</Label><Input value={editCompany.name} onChange={(e) => setEditCompany({...editCompany, name: e.target.value})} /></div>
                  <div>
                    <Label>Color</Label>
                    <Select value={editCompany.color} onValueChange={(v) => setEditCompany({...editCompany, color: v})}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: editCompany.color }}></div>
                          <span>{COMPANY_COLORS.find(c => c.value === editCompany.color)?.name || 'Custom'}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_COLORS.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div>
                              <span>{c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Data Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Connect your data sources to automatically import transactions.</p>
              <div className="grid grid-cols-2 gap-4">
                {PROVIDERS.map(provider => {
                  const Icon = provider.icon
                  return (
                    <div key={provider.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: provider.color + '20' }}>
                          <Icon className="h-5 w-5" style={{ color: provider.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-xs text-muted-foreground">{provider.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" disabled>
                        Connect (Coming Soon)
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ MAIN APP ============
export default function App() {
  const [view, setView] = useState('loading')
  const [holdingAccountId, setHoldingAccountId] = useState(null)
  const [selectedProfitCenterId, setSelectedProfitCenterId] = useState(null)
  const [holdingAccounts, setHoldingAccounts] = useState([])
  const [newAccountName, setNewAccountName] = useState('')

  useEffect(() => {
    // Check for existing holding accounts
    fetch('/api/holding-accounts')
      .then(res => res.json())
      .then(accounts => {
        setHoldingAccounts(accounts)
        if (accounts.length > 0) {
          setHoldingAccountId(accounts[0].id)
          setView('dashboard')
        } else {
          setView('onboarding')
        }
      })
      .catch(() => setView('onboarding'))
  }, [])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/holding-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAccountName || 'My Business' })
    })
    const account = await res.json()
    setHoldingAccountId(account.id)
    setView('dashboard')
  }

  const handleSelectProfitCenter = (id) => {
    setSelectedProfitCenterId(id)
    setView('profit-center')
  }

  const handleNavigate = (newView) => {
    if (newView === 'dashboard') {
      setSelectedProfitCenterId(null)
    }
    setView(newView)
  }

  // Loading
  if (view === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Onboarding
  if (view === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Fishing Poles Dashboard</CardTitle>
            <p className="text-muted-foreground">Track revenue across all your businesses</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label>Holding Account Name</Label>
                <Input placeholder="My Business Holdings" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {view === 'dashboard' && (
          <DashboardView 
            holdingAccountId={holdingAccountId} 
            onSelectProfitCenter={handleSelectProfitCenter}
            onNavigate={handleNavigate}
          />
        )}
        {view === 'profit-center' && (
          <ProfitCenterDetail 
            profitCenterId={selectedProfitCenterId} 
            holdingAccountId={holdingAccountId}
            onBack={() => handleNavigate('dashboard')}
          />
        )}
        {view === 'settings' && (
          <SettingsView 
            holdingAccountId={holdingAccountId}
            onBack={() => handleNavigate('dashboard')}
          />
        )}
      </div>
    </div>
  )
}
