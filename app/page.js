'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday } from 'date-fns'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, ChevronRight, Plus, Settings, Building2, TrendingUp, Calendar, ArrowLeft, Trash2, Edit, ShoppingBag, CreditCard, Package, Calculator, Link2, GripVertical, Pencil, Check, X, Clock, LayoutGrid, TrendingDown, DollarSign, MoreVertical } from 'lucide-react'

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

const COLUMN_COLORS = [
  { name: 'Gray', value: '#6b7280' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#a855f7' }
]

const PROVIDERS = [
  { id: 'shopify', name: 'Shopify', icon: ShoppingBag, color: '#96bf48', description: 'E-commerce orders & payouts' },
  { id: 'stripe', name: 'Stripe', icon: CreditCard, color: '#635bff', description: 'Charges & balance transactions' },
  { id: 'amazon', name: 'Amazon', icon: Package, color: '#ff9900', description: 'Settlement reports' },
  { id: 'quickbooks', name: 'QuickBooks', icon: Calculator, color: '#2ca01c', description: 'Sales receipts & invoices' }
]

function formatCents(cents) {
  if (!cents) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function getColorTint(hexColor) {
  return hexColor + '15'
}

// ============ HEADER COMPONENT ============
function DashboardHeader({ holdingAccount, onUpdateName, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(holdingAccount?.name || '')

  const handleSave = async () => {
    if (editName.trim()) {
      await onUpdateName(editName.trim())
      setIsEditing(false)
    }
  }

  return (
    <div className="border-b bg-white mb-6 -mx-4 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-64" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
              <Button size="icon" variant="ghost" onClick={handleSave}><Check className="h-4 w-4 text-green-600" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { setIsEditing(false); setEditName(holdingAccount?.name || '') }}><X className="h-4 w-4 text-red-500" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{holdingAccount?.name || 'Loading...'}</h1>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-6 w-6">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onNavigate('kanban')}><LayoutGrid className="h-4 w-4 mr-2" />Pipeline</Button>
          <Button variant="outline" onClick={() => onNavigate('settings')}><Settings className="h-4 w-4 mr-2" />Settings</Button>
        </div>
      </div>
    </div>
  )
}

// ============ KANBAN CARD COMPONENT ============
function KanbanCard({ card, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} 
      className={`bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{card.title}</h4>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(card) }}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}><Trash2 className="h-3 w-3 text-red-500" /></Button>
        </div>
      </div>
      {card.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{card.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {card.amount_cents && (
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <DollarSign className="h-3 w-3 mr-1" />{formatCents(card.amount_cents)}
          </Badge>
        )}
        {card.due_date && (
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />{card.due_date}
          </Badge>
        )}
        {card.priority === 'high' && <Badge variant="destructive" className="text-xs">High</Badge>}
      </div>
    </div>
  )
}

// ============ KANBAN COLUMN COMPONENT ============
function KanbanColumn({ column, cards, onAddCard, onEditCard, onDeleteCard, onEditColumn, onDeleteColumn }) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim())
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  const columnCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.display_order - b.display_order)

  return (
    <div ref={setNodeRef} style={style} className={`flex-shrink-0 w-72 bg-muted/50 rounded-lg ${isDragging ? 'ring-2 ring-primary' : ''}`}>
      <div className="p-3 border-b flex items-center justify-between" {...attributes} {...listeners}>
        <div className="flex items-center gap-2 cursor-grab">
          <div className="w-2 h-4 rounded" style={{ backgroundColor: column.color }}></div>
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <Badge variant="secondary" className="text-xs">{columnCards.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditColumn(column)}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteColumn(column.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
        <SortableContext items={columnCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {columnCards.map(card => (
            <KanbanCard key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
        
        {isAddingCard ? (
          <div className="bg-white border rounded-lg p-2 space-y-2">
            <Input placeholder="Card title..." value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddCard()} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAddingCard(false); setNewCardTitle('') }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setIsAddingCard(true)}>
            <Plus className="h-4 w-4 mr-2" />Add card
          </Button>
        )}
      </div>
    </div>
  )
}

// ============ KANBAN BOARD COMPONENT ============
function KanbanBoard({ holdingAccountId, profitCenterId = null, title = 'Pipeline' }) {
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCard, setEditCard] = useState(null)
  const [editColumn, setEditColumn] = useState(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnColor, setNewColumnColor] = useState('#6b7280')
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const pcParam = profitCenterId ? `&profit_center_id=${profitCenterId}` : ''
      
      // Initialize columns if needed
      await fetch('/api/kanban/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holding_account_id: holdingAccountId, profit_center_id: profitCenterId })
      })
      
      const [colRes, cardRes] = await Promise.all([
        fetch(`/api/kanban/columns?holding_account_id=${holdingAccountId}${pcParam}`),
        fetch(`/api/kanban/cards?holding_account_id=${holdingAccountId}${pcParam}`)
      ])
      setColumns(await colRes.json())
      setCards(await cardRes.json())
    } catch (e) {
      console.error('Failed to fetch kanban data:', e)
    }
    setLoading(false)
  }, [holdingAccountId, profitCenterId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return
    await fetch('/api/kanban/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, profit_center_id: profitCenterId, name: newColumnName, color: newColumnColor })
    })
    setNewColumnName('')
    setNewColumnColor('#6b7280')
    setIsAddingColumn(false)
    fetchData()
  }

  const handleUpdateColumn = async (e) => {
    e.preventDefault()
    await fetch(`/api/kanban/columns/${editColumn.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editColumn.name, color: editColumn.color })
    })
    setEditColumn(null)
    fetchData()
  }

  const handleDeleteColumn = async (id) => {
    if (!confirm('Delete this column and all its cards?')) return
    await fetch(`/api/kanban/columns/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddCard = async (columnId, title) => {
    await fetch('/api/kanban/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, profit_center_id: profitCenterId, column_id: columnId, title })
    })
    fetchData()
  }

  const handleUpdateCard = async (e) => {
    e.preventDefault()
    await fetch(`/api/kanban/cards/${editCard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editCard.title, description: editCard.description, amount: editCard.amount, due_date: editCard.due_date, priority: editCard.priority })
    })
    setEditCard(null)
    fetchData()
  }

  const handleDeleteCard = async (id) => {
    await fetch(`/api/kanban/cards/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return
    
    const activeCard = cards.find(c => c.id === active.id)
    const overCard = cards.find(c => c.id === over.id)
    const overColumn = columns.find(c => c.id === over.id)
    
    if (activeCard) {
      let newColumnId = activeCard.column_id
      let newOrder = activeCard.display_order
      
      if (overCard) {
        newColumnId = overCard.column_id
        newOrder = overCard.display_order
      } else if (overColumn) {
        newColumnId = overColumn.id
        newOrder = cards.filter(c => c.column_id === overColumn.id).length
      }
      
      if (newColumnId !== activeCard.column_id || newOrder !== activeCard.display_order) {
        await fetch('/api/kanban/cards/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: active.id, column_id: newColumnId, new_order: newOrder })
        })
        fetchData()
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {isAddingColumn ? (
          <div className="flex items-center gap-2">
            <Input placeholder="Column name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="w-40" />
            <Select value={newColumnColor} onValueChange={setNewColumnColor}>
              <SelectTrigger className="w-24">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: newColumnColor }}></div>
                </div>
              </SelectTrigger>
              <SelectContent>
                {COLUMN_COLORS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: c.value }}></div>
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAddColumn}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAddingColumn(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsAddingColumn(true)}><Plus className="h-4 w-4 mr-2" />Add Column</Button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={cards}
                onAddCard={handleAddCard}
                onEditCard={setEditCard}
                onDeleteCard={handleDeleteCard}
                onEditColumn={setEditColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Edit Card Dialog */}
      {editCard && (
        <Dialog open={!!editCard} onOpenChange={() => setEditCard(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Card</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div><Label>Title</Label><Input value={editCard.title} onChange={(e) => setEditCard({...editCard, title: e.target.value})} /></div>
              <div><Label>Description</Label><Textarea value={editCard.description || ''} onChange={(e) => setEditCard({...editCard, description: e.target.value})} /></div>
              <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={editCard.amount || ''} onChange={(e) => setEditCard({...editCard, amount: e.target.value})} /></div>
              <div><Label>Due Date</Label><Input type="date" value={editCard.due_date || ''} onChange={(e) => setEditCard({...editCard, due_date: e.target.value})} /></div>
              <div>
                <Label>Priority</Label>
                <Select value={editCard.priority || 'medium'} onValueChange={(v) => setEditCard({...editCard, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Column Dialog */}
      {editColumn && (
        <Dialog open={!!editColumn} onOpenChange={() => setEditColumn(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Column</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateColumn} className="space-y-4">
              <div><Label>Name</Label><Input value={editColumn.name} onChange={(e) => setEditColumn({...editColumn, name: e.target.value})} /></div>
              <div>
                <Label>Color</Label>
                <Select value={editColumn.color} onValueChange={(v) => setEditColumn({...editColumn, color: v})}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: editColumn.color }}></div>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_COLORS.map(c => (
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
    </div>
  )
}

// ============ SORTABLE COMPANY ITEM ============
function SortableCompanyItem({ company, profitCenters, onEdit, onDelete, onAddPC, onDeletePC, newPC, setNewPC }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: company.id })
  
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'ring-2 ring-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="w-4 h-8 rounded" style={{ backgroundColor: company.color }}></div>
            <CardTitle>{company.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(company)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(company.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); onAddPC(company.id) }} className="flex gap-2">
          <Input placeholder="Profit center name" value={newPC.company_id === company.id ? newPC.name : ''} onChange={(e) => setNewPC({ company_id: company.id, name: e.target.value })} className="flex-1" />
          <Button type="submit" disabled={newPC.company_id !== company.id || !newPC.name}><Plus className="h-4 w-4 mr-2" />Add</Button>
        </form>
        <div className="space-y-2">
          {profitCenters.filter(pc => pc.company_id === company.id && pc.active !== false).map(pc => (
            <div key={pc.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded" style={{ backgroundColor: company.color }}></div>
                <span>{pc.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDeletePC(pc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ DASHBOARD VIEW ============
function DashboardView({ holdingAccountId, holdingAccount, onSelectProfitCenter, onNavigate, onUpdateHoldingName }) {
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()))
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cellTxnOpen, setCellTxnOpen] = useState(false)
  const [cellTxnData, setCellTxnData] = useState({ profit_center_id: '', company_id: '', date: '', amount: '', description: '', pc_name: '', company_name: '', is_projected: false })

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

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1))
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1))
  const handleToday = () => setSelectedMonth(startOfMonth(new Date()))

  const handleCellClick = (pc, company, dateStr) => {
    setCellTxnData({ profit_center_id: pc.id, company_id: company.id, date: dateStr, amount: '', description: '', pc_name: pc.name, company_name: company.name, company_color: company.color, is_projected: false })
    setCellTxnOpen(true)
  }

  const handleCellAddTransaction = async (e) => {
    e.preventDefault()
    if (!cellTxnData.amount) return
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, profit_center_id: cellTxnData.profit_center_id, company_id: cellTxnData.company_id, txn_date: cellTxnData.date, amount: parseFloat(cellTxnData.amount), description: cellTxnData.description, provider: 'manual', is_projected: cellTxnData.is_projected })
    })
    setCellTxnOpen(false)
    setCellTxnData({ profit_center_id: '', company_id: '', date: '', amount: '', description: '', pc_name: '', company_name: '', is_projected: false })
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
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Revenue Dashboard</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-lg font-semibold min-w-[140px] text-center">{format(selectedMonth, 'MMMM yyyy')}</span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={handleToday} className="ml-2"><Calendar className="h-4 w-4 mr-2" />Today</Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-600"></div><span className="text-muted-foreground">Actual</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-gray-400"></div><span className="text-muted-foreground">Projected</span></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MTD Revenue (Actual)</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCents(dashboardData?.grand_mtd || 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Run-Rate Projection</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{formatCents(dashboardData?.grand_projection || 0)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Companies / Profit Centers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardData?.companies?.length || 0} / {dashboardData?.profit_centers?.length || 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-max relative">
              <div className="flex border-b bg-muted/50">
                <div className="w-[200px] min-w-[200px] p-3 font-semibold border-r bg-muted sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Profit Center</div>
                {days.map(d => (<div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-xs border-r ${d.isToday ? 'bg-primary/10 font-bold' : ''}`}><div className="text-muted-foreground">{d.dow}</div><div>{d.day}</div></div>))}
                <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold border-r bg-muted">MTD</div>
                <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold bg-muted">Projection</div>
              </div>

              {dashboardData?.companies?.map(company => (
                <div key={company.id}>
                  <div className="flex border-b" style={{ backgroundColor: getColorTint(company.color) }}>
                    <div className="w-[200px] min-w-[200px] p-2 font-semibold flex items-center gap-2 border-r sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: getColorTint(company.color) }}>
                      <div className="w-3 h-full min-h-[24px] rounded" style={{ backgroundColor: company.color }}></div>
                      <Building2 className="h-4 w-4" style={{ color: company.color }} />
                      <span>{company.name}</span>
                    </div>
                    {days.map(d => <div key={d.date} className="w-[80px] min-w-[80px] border-r"></div>)}
                    <div className="w-[100px] min-w-[100px] border-r"></div>
                    <div className="w-[100px] min-w-[100px]"></div>
                  </div>

                  {company.profit_centers?.map(pc => (
                    <div key={pc.id} className="flex border-b hover:bg-muted/30 group">
                      <div className="w-[200px] min-w-[200px] p-2 pl-6 flex items-center gap-2 border-r cursor-pointer hover:bg-muted/50 bg-background sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" onClick={() => onSelectProfitCenter(pc.id)}>
                        <div className="w-1 h-6 rounded" style={{ backgroundColor: company.color }}></div>
                        <span className="truncate group-hover:underline">{pc.name}</span>
                        {pc.include_in_projection === false && <TrendingDown className="h-3 w-3 text-muted-foreground" title="Excluded from projection" />}
                      </div>
                      {days.map(d => {
                        const actualAmount = pc.daily?.[d.date] || 0
                        const projectedAmount = pc.daily_projected?.[d.date] || 0
                        return (
                          <div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-sm border-r cursor-pointer hover:bg-primary/10 transition-colors ${d.isToday ? 'bg-primary/5' : ''}`} onClick={() => handleCellClick(pc, company, d.date)} title={`Click to add transaction`}>
                            {actualAmount > 0 && <div className="text-green-700 font-medium">{formatCents(actualAmount)}</div>}
                            {projectedAmount > 0 && <div className="text-gray-400 font-medium flex items-center justify-center gap-1"><Clock className="h-3 w-3" />{formatCents(projectedAmount)}</div>}
                            {!actualAmount && !projectedAmount && <span className="text-muted-foreground/30 group-hover:text-primary">+</span>}
                          </div>
                        )
                      })}
                      <div className="w-[100px] min-w-[100px] p-2 text-center font-semibold text-green-700 border-r">{formatCents(pc.mtd)}</div>
                      <div className={`w-[100px] min-w-[100px] p-2 text-center font-semibold ${pc.include_in_projection === false ? 'text-gray-400 line-through' : 'text-blue-700'}`}>{formatCents(pc.projection)}</div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="flex border-t-2 border-primary bg-muted font-bold">
                <div className="w-[200px] min-w-[200px] p-3 border-r bg-muted sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">TOTALS</div>
                {days.map(d => {
                  const actualTotal = dashboardData?.daily_totals?.[d.date] || 0
                  const projectedTotal = dashboardData?.daily_projected_totals?.[d.date] || 0
                  return (
                    <div key={d.date} className={`w-[80px] min-w-[80px] p-2 text-center text-sm border-r ${d.isToday ? 'bg-primary/10' : ''}`}>
                      {actualTotal > 0 && <div className="text-green-700">{formatCents(actualTotal)}</div>}
                      {projectedTotal > 0 && <div className="text-gray-400 text-xs">(+{formatCents(projectedTotal)})</div>}
                      {actualTotal === 0 && projectedTotal === 0 && '-'}
                    </div>
                  )
                })}
                <div className="w-[100px] min-w-[100px] p-2 text-center text-green-700 border-r">{formatCents(dashboardData?.grand_mtd || 0)}</div>
                <div className="w-[100px] min-w-[100px] p-2 text-center text-blue-700">{formatCents(dashboardData?.grand_projection || 0)}</div>
              </div>
            </div>
          </div>
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

      <Dialog open={cellTxnOpen} onOpenChange={setCellTxnOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="w-3 h-6 rounded" style={{ backgroundColor: cellTxnData.company_color }}></div>Add Transaction</DialogTitle></DialogHeader>
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Profit Center</div>
            <div className="font-semibold">{cellTxnData.company_name} / {cellTxnData.pc_name}</div>
            <div className="text-sm text-muted-foreground mt-2">Date</div>
            <div className="font-semibold">{cellTxnData.date}</div>
          </div>
          <form onSubmit={handleCellAddTransaction} className="space-y-4">
            <div><Label>Amount ($)</Label><Input type="number" step="0.01" placeholder="0.00" value={cellTxnData.amount} onChange={(e) => setCellTxnData({...cellTxnData, amount: e.target.value})} autoFocus /></div>
            <div><Label>Description (optional)</Label><Input placeholder="Payment from customer..." value={cellTxnData.description} onChange={(e) => setCellTxnData({...cellTxnData, description: e.target.value})} /></div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-amber-50 border-amber-200">
              <Checkbox id="is_projected" checked={cellTxnData.is_projected} onCheckedChange={(checked) => setCellTxnData({...cellTxnData, is_projected: checked})} />
              <div className="flex-1">
                <Label htmlFor="is_projected" className="text-sm font-medium cursor-pointer flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" />Projected Revenue</Label>
                <p className="text-xs text-muted-foreground">This revenue is expected but hasn't been received yet.</p>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!cellTxnData.amount}>{cellTxnData.is_projected ? 'Add as Projected' : 'Add Transaction'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ PROFIT CENTER DETAIL VIEW ============
function ProfitCenterDetail({ profitCenterId, holdingAccountId, holdingAccount, onBack, onUpdateHoldingName, onNavigate }) {
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

  const handleToggleProjection = async () => {
    const newValue = !(profitCenter.include_in_projection !== false)
    await fetch(`/api/profit-centers/${profitCenterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include_in_projection: newValue })
    })
    setProfitCenter({ ...profitCenter, include_in_projection: newValue })
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profit_center_id: profitCenterId, text: newNote }) })
    setNewNote('')
    fetchData()
  }

  const handleDeleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddOverhead = async (e) => {
    e.preventDefault()
    await fetch('/api/overhead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profit_center_id: profitCenterId, ...newOverhead, amount: parseFloat(newOverhead.amount) }) })
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
    await fetch(`/api/transactions/${editTxn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txn_date: editTxn.txn_date, amount: parseFloat(editTxn.amount), description: editTxn.description, is_projected: editTxn.is_projected }) })
    setEditTxn(null)
    fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  const includeInProjection = profitCenter?.include_in_projection !== false

  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <div className="flex items-center gap-2">
            {company && <div className="w-3 h-6 rounded" style={{ backgroundColor: company.color }}></div>}
            <h1 className="text-2xl font-bold">{profitCenter?.name}</h1>
            {company && <Badge variant="outline" style={{ borderColor: company.color, color: company.color }}>{company.name}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="projection-toggle" className="text-sm">Include in Run-Rate Projection</Label>
          </div>
          <Switch id="projection-toggle" checked={includeInProjection} onCheckedChange={handleToggleProjection} />
        </div>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="kanban">Pipeline</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="overhead">Overhead ({overhead.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => (
                    <div key={txn.id} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 ${txn.is_projected ? 'bg-amber-50 border-amber-200' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-24">{txn.txn_date}</div>
                        <div className={`font-semibold w-24 ${txn.is_projected ? 'text-gray-400' : 'text-green-700'}`}>{formatCents(txn.amount_cents)}</div>
                        {txn.is_projected && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" />Projected</Badge>}
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

          {editTxn && (
            <Dialog open={!!editTxn} onOpenChange={() => setEditTxn(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateTransaction} className="space-y-4">
                  <div><Label>Date</Label><Input type="date" value={editTxn.txn_date} onChange={(e) => setEditTxn({...editTxn, txn_date: e.target.value})} /></div>
                  <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={editTxn.amount} onChange={(e) => setEditTxn({...editTxn, amount: e.target.value})} /></div>
                  <div><Label>Description</Label><Input value={editTxn.description || ''} onChange={(e) => setEditTxn({...editTxn, description: e.target.value})} /></div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg bg-amber-50 border-amber-200">
                    <Checkbox id="edit_is_projected" checked={editTxn.is_projected || false} onCheckedChange={(checked) => setEditTxn({...editTxn, is_projected: checked})} />
                    <div className="flex-1">
                      <Label htmlFor="edit_is_projected" className="text-sm font-medium cursor-pointer flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" />Projected Revenue</Label>
                      <p className="text-xs text-muted-foreground">Uncheck to confirm this revenue has been received.</p>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <Card>
            <CardContent className="pt-6">
              <KanbanBoard holdingAccountId={holdingAccountId} profitCenterId={profitCenterId} title={`${profitCenter?.name} Pipeline`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader><CardTitle>Notes / Pass-Down Log</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddNote} className="flex gap-2">
                <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="flex-1" />
                <Button type="submit" disabled={!newNote.trim()}>Add Note</Button>
              </form>
              <Separator />
              {notes.length === 0 ? <p className="text-muted-foreground text-center py-8">No notes yet.</p> : (
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

        <TabsContent value="overhead">
          <Card>
            <CardHeader><CardTitle>Overhead Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddOverhead} className="grid grid-cols-5 gap-2">
                <Input placeholder="Name" value={newOverhead.name} onChange={(e) => setNewOverhead({...newOverhead, name: e.target.value})} />
                <Input type="number" step="0.01" placeholder="Amount" value={newOverhead.amount} onChange={(e) => setNewOverhead({...newOverhead, amount: e.target.value})} />
                <Select value={newOverhead.frequency} onValueChange={(v) => setNewOverhead({...newOverhead, frequency: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select>
                <Input placeholder="Note" value={newOverhead.note} onChange={(e) => setNewOverhead({...newOverhead, note: e.target.value})} />
                <Button type="submit" disabled={!newOverhead.name || !newOverhead.amount}>Add</Button>
              </form>
              <Separator />
              {overhead.length === 0 ? <p className="text-muted-foreground text-center py-8">No overhead items yet.</p> : (
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

// ============ MASTER KANBAN VIEW ============
function MasterKanbanView({ holdingAccountId, holdingAccount, onBack, onUpdateHoldingName, onNavigate }) {
  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} />
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
        <h1 className="text-2xl font-bold">Master Pipeline</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <KanbanBoard holdingAccountId={holdingAccountId} profitCenterId={null} title="All Opportunities" />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ SETTINGS VIEW ============
function SettingsView({ holdingAccountId, holdingAccount, onBack, onUpdateHoldingName, onNavigate }) {
  const [companies, setCompanies] = useState([])
  const [profitCenters, setProfitCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCompany, setNewCompany] = useState({ name: '', color: COMPANY_COLORS[0].value })
  const [newPC, setNewPC] = useState({ company_id: '', name: '' })
  const [editCompany, setEditCompany] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [compRes, pcRes] = await Promise.all([fetch(`/api/companies?holding_account_id=${holdingAccountId}`), fetch(`/api/profit-centers?holding_account_id=${holdingAccountId}`)])
    setCompanies(await compRes.json())
    setProfitCenters(await pcRes.json())
    setLoading(false)
  }, [holdingAccountId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddCompany = async (e) => {
    e.preventDefault()
    await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holding_account_id: holdingAccountId, ...newCompany }) })
    setNewCompany({ name: '', color: COMPANY_COLORS[companies.length % COMPANY_COLORS.length].value })
    fetchData()
  }

  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    await fetch(`/api/companies/${editCompany.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editCompany.name, color: editCompany.color }) })
    setEditCompany(null)
    fetchData()
  }

  const handleDeleteCompany = async (id) => {
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleAddProfitCenter = async (companyId) => {
    if (newPC.company_id !== companyId || !newPC.name) return
    await fetch('/api/profit-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holding_account_id: holdingAccountId, company_id: companyId, name: newPC.name }) })
    setNewPC({ company_id: '', name: '' })
    fetchData()
  }

  const handleDeleteProfitCenter = async (id) => {
    await fetch(`/api/profit-centers/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = companies.findIndex(c => c.id === active.id)
      const newIndex = companies.findIndex(c => c.id === over.id)
      const newOrder = arrayMove(companies, oldIndex, newIndex)
      setCompanies(newOrder)
      await fetch('/api/companies/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: newOrder.map(c => c.id) }) })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  const activeCompanies = companies.filter(c => c.active !== false)

  return (
    <div className="space-y-6">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} />
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies & Profit Centers</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Add Company</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddCompany} className="flex gap-4">
                <Input placeholder="Company name" value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} className="flex-1" />
                <Select value={newCompany.color} onValueChange={(v) => setNewCompany({...newCompany, color: v})}>
                  <SelectTrigger className="w-[180px]"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: newCompany.color }}></div><span>{COMPANY_COLORS.find(c => c.value === newCompany.color)?.name}</span></div></SelectTrigger>
                  <SelectContent>{COMPANY_COLORS.map(c => (<SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div><span>{c.name}</span></div></SelectItem>))}</SelectContent>
                </Select>
                <Button type="submit" disabled={!newCompany.name}><Plus className="h-4 w-4 mr-2" />Add Company</Button>
              </form>
            </CardContent>
          </Card>

          {activeCompanies.length > 1 && <div className="flex items-center gap-2 text-sm text-muted-foreground"><GripVertical className="h-4 w-4" /><span>Drag companies to reorder them</span></div>}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeCompanies.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {activeCompanies.map(company => (<SortableCompanyItem key={company.id} company={company} profitCenters={profitCenters} onEdit={setEditCompany} onDelete={handleDeleteCompany} onAddPC={handleAddProfitCenter} onDeletePC={handleDeleteProfitCenter} newPC={newPC} setNewPC={setNewPC} />))}
              </div>
            </SortableContext>
          </DndContext>

          {editCompany && (
            <Dialog open={!!editCompany} onOpenChange={() => setEditCompany(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
                <form onSubmit={handleUpdateCompany} className="space-y-4">
                  <div><Label>Name</Label><Input value={editCompany.name} onChange={(e) => setEditCompany({...editCompany, name: e.target.value})} /></div>
                  <div>
                    <Label>Color</Label>
                    <Select value={editCompany.color} onValueChange={(v) => setEditCompany({...editCompany, color: v})}>
                      <SelectTrigger><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: editCompany.color }}></div><span>{COMPANY_COLORS.find(c => c.value === editCompany.color)?.name || 'Custom'}</span></div></SelectTrigger>
                      <SelectContent>{COMPANY_COLORS.map(c => (<SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div><span>{c.name}</span></div></SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Data Connections</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Connect your data sources to automatically import transactions.</p>
              <div className="grid grid-cols-2 gap-4">
                {PROVIDERS.map(provider => {
                  const Icon = provider.icon
                  return (
                    <div key={provider.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: provider.color + '20' }}><Icon className="h-5 w-5" style={{ color: provider.color }} /></div>
                        <div><h3 className="font-semibold">{provider.name}</h3><p className="text-xs text-muted-foreground">{provider.description}</p></div>
                      </div>
                      <Button variant="outline" className="w-full" disabled>Connect (Coming Soon)</Button>
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
  const [holdingAccount, setHoldingAccount] = useState(null)
  const [selectedProfitCenterId, setSelectedProfitCenterId] = useState(null)
  const [newAccountName, setNewAccountName] = useState('')

  const fetchHoldingAccount = useCallback(async (id) => {
    const res = await fetch(`/api/holding-accounts/${id}`)
    const account = await res.json()
    setHoldingAccount(account)
  }, [])

  useEffect(() => {
    fetch('/api/holding-accounts').then(res => res.json()).then(accounts => {
      if (accounts.length > 0) {
        setHoldingAccountId(accounts[0].id)
        setHoldingAccount(accounts[0])
        setView('dashboard')
      } else {
        setView('onboarding')
      }
    }).catch(() => setView('onboarding'))
  }, [])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/holding-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAccountName || 'My Business' }) })
    const account = await res.json()
    setHoldingAccountId(account.id)
    setHoldingAccount(account)
    setView('dashboard')
  }

  const handleUpdateHoldingName = async (name) => {
    await fetch(`/api/holding-accounts/${holdingAccountId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    await fetchHoldingAccount(holdingAccountId)
  }

  const handleSelectProfitCenter = (id) => { setSelectedProfitCenterId(id); setView('profit-center') }
  const handleNavigate = (newView) => { if (newView === 'dashboard') setSelectedProfitCenterId(null); setView(newView) }

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading...</p></div></div>

  if (view === 'onboarding') return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><TrendingUp className="h-8 w-8 text-primary" /></div>
          <CardTitle className="text-2xl">Fishing Poles Dashboard</CardTitle>
          <p className="text-muted-foreground">Track revenue across all your businesses</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div><Label>Holding Company Name</Label><Input placeholder="My Business Holdings" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} /></div>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {view === 'dashboard' && <DashboardView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onSelectProfitCenter={handleSelectProfitCenter} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} />}
        {view === 'profit-center' && <ProfitCenterDetail profitCenterId={selectedProfitCenterId} holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} />}
        {view === 'kanban' && <MasterKanbanView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} />}
        {view === 'settings' && <SettingsView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} />}
      </div>
    </div>
  )
}
