'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday } from 'date-fns'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { ChevronLeft, ChevronRight, Plus, Settings, Building2, TrendingUp, Calendar, ArrowLeft, Trash2, Edit, ShoppingBag, CreditCard, Package, Calculator, Link2, GripVertical, Pencil, Check, X, Clock, LayoutGrid, TrendingDown, DollarSign, Target, CheckCircle2, Users, ExternalLink, FileText, Mountain } from 'lucide-react'

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
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' }
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
function DashboardHeader({ holdingAccount, onUpdateName, onNavigate, currentView }) {
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
          <Button variant={currentView === 'plan' ? 'default' : 'outline'} onClick={() => onNavigate('plan')}><LayoutGrid className="h-4 w-4 mr-2" />Plan</Button>
          <Button variant={currentView === 'progress' ? 'default' : 'outline'} onClick={() => onNavigate('progress')}><CheckCircle2 className="h-4 w-4 mr-2" />Progress</Button>
          <Button variant={currentView === 'rocks' ? 'default' : 'outline'} onClick={() => onNavigate('rocks')}><Mountain className="h-4 w-4 mr-2" />Rocks</Button>
          <Button variant={currentView === 'settings' ? 'default' : 'outline'} onClick={() => onNavigate('settings')}><Settings className="h-4 w-4 mr-2" />Settings</Button>
        </div>
      </div>
    </div>
  )
}

// ============ KANBAN CARD COMPONENT ============
function KanbanCard({ card, onEdit, onDelete, profitCenters, companies }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  
  const pc = profitCenters?.find(p => p.id === card.profit_center_id)
  const company = companies?.find(c => c.id === card.company_id || c.id === pc?.company_id)

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} 
      className={`bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{card.title}</h4>
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(card) }}><Edit className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(card.id) }}><Trash2 className="h-3 w-3 text-red-500" /></Button>
        </div>
      </div>
      {card.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{card.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        {company && (
          <Badge variant="outline" className="text-xs" style={{ borderColor: company.color, color: company.color }}>
            {company.name}
          </Badge>
        )}
        {pc && <Badge variant="secondary" className="text-xs">{pc.name}</Badge>}
        {card.amount_cents && (
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <DollarSign className="h-3 w-3 mr-1" />{formatCents(card.amount_cents)}
          </Badge>
        )}
        {card.due_date && <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{card.due_date}</Badge>}
        {card.priority === 'high' && <Badge variant="destructive" className="text-xs">High</Badge>}
        {card.completed_at && <Badge className="bg-green-500 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Done</Badge>}
      </div>
    </div>
  )
}

// ============ KANBAN COLUMN COMPONENT ============
function KanbanColumn({ column, cards, onAddCard, onEditCard, onDeleteCard, onEditColumn, onDeleteColumn, profitCenters, companies, profitCenterId }) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

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
          <h3 className="font-semibold text-sm">{column.title || column.name}</h3>
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
            <KanbanCard key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} profitCenters={profitCenters} companies={companies} />
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
function KanbanBoard({ holdingAccountId, profitCenterId = null, companyId = null, title = 'Plan', companies = [], profitCenters = [], showFilters = false }) {
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCard, setEditCard] = useState(null)
  const [editColumn, setEditColumn] = useState(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newColumnColor, setNewColumnColor] = useState('#6b7280')
  const [filterCompany, setFilterCompany] = useState(companyId || 'all')
  const [filterPC, setFilterPC] = useState(profitCenterId || 'all')
  const [cardResources, setCardResources] = useState([])
  const [newResourceUrl, setNewResourceUrl] = useState('')
  const [newResourceTitle, setNewResourceTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Initialize columns if needed
      await fetch('/api/kanban/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holding_account_id: holdingAccountId })
      })
      
      // Fetch columns (shared across all)
      const colRes = await fetch(`/api/kanban/columns?holding_account_id=${holdingAccountId}`)
      setColumns(await colRes.json())
      
      // Fetch cards with filters
      let cardUrl = `/api/kanban/cards?holding_account_id=${holdingAccountId}`
      if (profitCenterId) cardUrl += `&profit_center_id=${profitCenterId}`
      else if (companyId) cardUrl += `&company_id=${companyId}`
      
      const cardRes = await fetch(cardUrl)
      setCards(await cardRes.json())
    } catch (e) {
      console.error('Failed to fetch kanban data:', e)
    }
    setLoading(false)
  }, [holdingAccountId, profitCenterId, companyId])

  useEffect(() => { fetchData() }, [fetchData])

  // Refetch when filters change
  useEffect(() => {
    if (!showFilters) return
    const fetchFiltered = async () => {
      let cardUrl = `/api/kanban/cards?holding_account_id=${holdingAccountId}`
      if (filterPC !== 'all') cardUrl += `&profit_center_id=${filterPC}`
      else if (filterCompany !== 'all') cardUrl += `&company_id=${filterCompany}`
      const cardRes = await fetch(cardUrl)
      setCards(await cardRes.json())
    }
    fetchFiltered()
  }, [filterCompany, filterPC, holdingAccountId, showFilters])

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return
    await fetch('/api/kanban/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, title: newColumnTitle, color: newColumnColor })
    })
    setNewColumnTitle('')
    setNewColumnColor('#6b7280')
    setIsAddingColumn(false)
    fetchData()
  }

  const handleUpdateColumn = async (e) => {
    e.preventDefault()
    await fetch(`/api/kanban/columns/${editColumn.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editColumn.title || editColumn.name, color: editColumn.color })
    })
    setEditColumn(null)
    fetchData()
  }

  const handleDeleteColumn = async (id) => {
    if (!confirm('Delete this column? Cards will be moved to the previous column.')) return
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
      body: JSON.stringify({ title: editCard.title, description: editCard.description, amount: editCard.amount, due_date: editCard.due_date, priority: editCard.priority, profit_center_id: editCard.profit_center_id })
    })
    setEditCard(null)
    fetchData()
  }

  const handleDeleteCard = async (id) => {
    await fetch(`/api/kanban/cards/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
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

  // Fetch resources for card
  const fetchCardResources = async (cardId) => {
    const res = await fetch(`/api/resources?holding_account_id=${holdingAccountId}&scope_type=card&scope_id=${cardId}`)
    setCardResources(await res.json())
  }

  const handleAddResource = async () => {
    if (!newResourceUrl.trim() || !editCard) return
    await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, scope_type: 'card', scope_id: editCard.id, title: newResourceTitle || newResourceUrl, url: newResourceUrl })
    })
    setNewResourceUrl('')
    setNewResourceTitle('')
    fetchCardResources(editCard.id)
  }

  const handleDeleteResource = async (id) => {
    await fetch(`/api/resources/${id}`, { method: 'DELETE' })
    if (editCard) fetchCardResources(editCard.id)
  }

  useEffect(() => {
    if (editCard?.id) fetchCardResources(editCard.id)
  }, [editCard?.id])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  const filteredPCs = filterCompany !== 'all' ? profitCenters.filter(pc => pc.company_id === filterCompany) : profitCenters

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {showFilters && (
            <>
              <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setFilterPC('all') }}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Companies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPC} onValueChange={setFilterPC}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Profit Centers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profit Centers</SelectItem>
                  {filteredPCs.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
          {isAddingColumn ? (
            <div className="flex items-center gap-2">
              <Input placeholder="Column name" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} className="w-40" />
              <Select value={newColumnColor} onValueChange={setNewColumnColor}>
                <SelectTrigger className="w-24"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: newColumnColor }}></div></div></SelectTrigger>
                <SelectContent>
                  {COLUMN_COLORS.map(c => (<SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: c.value }}></div><span>{c.name}</span></div></SelectItem>))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAddColumn}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingColumn(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsAddingColumn(true)}><Plus className="h-4 w-4 mr-2" />Add Column</Button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(column => (
              <KanbanColumn key={column.id} column={column} cards={cards} onAddCard={handleAddCard} onEditCard={setEditCard} onDeleteCard={handleDeleteCard} onEditColumn={setEditColumn} onDeleteColumn={handleDeleteColumn} profitCenters={profitCenters} companies={companies} profitCenterId={profitCenterId} />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Edit Card Dialog */}
      {editCard && (
        <Dialog open={!!editCard} onOpenChange={() => setEditCard(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Edit Card</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div><Label>Title</Label><Input value={editCard.title} onChange={(e) => setEditCard({...editCard, title: e.target.value})} /></div>
              <div><Label>Description</Label><Textarea value={editCard.description || ''} onChange={(e) => setEditCard({...editCard, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={editCard.amount || ''} onChange={(e) => setEditCard({...editCard, amount: e.target.value})} /></div>
                <div><Label>Due Date</Label><Input type="date" value={editCard.due_date || ''} onChange={(e) => setEditCard({...editCard, due_date: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label>Profit Center</Label>
                  <Select value={editCard.profit_center_id || ''} onValueChange={(v) => setEditCard({...editCard, profit_center_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {profitCenters.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Links Section */}
              <div className="border-t pt-4">
                <Label className="flex items-center gap-2 mb-2"><Link2 className="h-4 w-4" />Links</Label>
                <div className="space-y-2 mb-2">
                  {cardResources.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <ExternalLink className="h-3 w-3" />{r.title}
                      </a>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteResource(r.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Title" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} className="flex-1" />
                  <Input placeholder="URL" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} className="flex-1" />
                  <Button type="button" size="sm" onClick={handleAddResource}>Add</Button>
                </div>
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
              <div><Label>Name</Label><Input value={editColumn.title || editColumn.name} onChange={(e) => setEditColumn({...editColumn, title: e.target.value, name: e.target.value})} /></div>
              <div>
                <Label>Color</Label>
                <Select value={editColumn.color} onValueChange={(v) => setEditColumn({...editColumn, color: v})}>
                  <SelectTrigger><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: editColumn.color }}></div></div></SelectTrigger>
                  <SelectContent>
                    {COLUMN_COLORS.map(c => (<SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div><span>{c.name}</span></div></SelectItem>))}
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

// ============ ROCKS COMPONENT ============
function RocksSection({ holdingAccountId, profitCenterId = null, companyId = null, teamMembers = [], compact = false }) {
  const [rocks, setRocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editRock, setEditRock] = useState(null)
  const [isAdding, setIsAdding] = useState(false)

  const fetchRocks = useCallback(async () => {
    setLoading(true)
    let url = `/api/rocks?holding_account_id=${holdingAccountId}&status=active`
    if (profitCenterId) url += `&profit_center_id=${profitCenterId}`
    else if (companyId) url += `&company_id=${companyId}`
    const res = await fetch(url)
    setRocks(await res.json())
    setLoading(false)
  }, [holdingAccountId, profitCenterId, companyId])

  useEffect(() => { fetchRocks() }, [fetchRocks])

  const handleSaveRock = async (e) => {
    e.preventDefault()
    const method = editRock.id ? 'PUT' : 'POST'
    const url = editRock.id ? `/api/rocks/${editRock.id}` : '/api/rocks'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editRock, holding_account_id: holdingAccountId, profit_center_id: profitCenterId })
    })
    setEditRock(null)
    setIsAdding(false)
    fetchRocks()
  }

  const handleCompleteRock = async (rock) => {
    await fetch(`/api/rocks/${rock.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
    fetchRocks()
  }

  const handleDeleteRock = async (id) => {
    await fetch(`/api/rocks/${id}`, { method: 'DELETE' })
    fetchRocks()
  }

  if (loading) return <div className="text-center py-4 text-muted-foreground">Loading rocks...</div>

  return (
    <div className={compact ? '' : 'space-y-4'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2"><Mountain className="h-4 w-4" />Rocks (Quarterly Goals)</h3>
        <Button size="sm" onClick={() => { setIsAdding(true); setEditRock({ title: '', specific: '', measurable: '', attainable: '', realistic: '', time_bound: '', due_date: '' }) }}><Plus className="h-4 w-4 mr-1" />Add Rock</Button>
      </div>
      
      {rocks.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">No active rocks. Add your quarterly goals!</p>
      ) : (
        <div className="space-y-2">
          {rocks.map(rock => (
            <div key={rock.id} className="border rounded-lg p-3 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{rock.title}</h4>
                  {rock.due_date && <p className="text-xs text-muted-foreground">Due: {rock.due_date}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCompleteRock(rock)}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditRock(rock)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteRock(rock.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Rock Dialog */}
      {(editRock || isAdding) && (
        <Dialog open={!!editRock || isAdding} onOpenChange={() => { setEditRock(null); setIsAdding(false) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editRock?.id ? 'Edit Rock' : 'New Rock'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveRock} className="space-y-3">
              <div><Label>Title</Label><Input value={editRock?.title || ''} onChange={(e) => setEditRock({...editRock, title: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Specific</Label><Textarea rows={2} value={editRock?.specific || ''} onChange={(e) => setEditRock({...editRock, specific: e.target.value})} placeholder="What exactly?" /></div>
                <div><Label>Measurable</Label><Textarea rows={2} value={editRock?.measurable || ''} onChange={(e) => setEditRock({...editRock, measurable: e.target.value})} placeholder="How to measure?" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Attainable</Label><Textarea rows={2} value={editRock?.attainable || ''} onChange={(e) => setEditRock({...editRock, attainable: e.target.value})} placeholder="Is it achievable?" /></div>
                <div><Label>Realistic</Label><Textarea rows={2} value={editRock?.realistic || ''} onChange={(e) => setEditRock({...editRock, realistic: e.target.value})} placeholder="Is it realistic?" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Time-Bound</Label><Textarea rows={2} value={editRock?.time_bound || ''} onChange={(e) => setEditRock({...editRock, time_bound: e.target.value})} placeholder="Timeline?" /></div>
                <div><Label>Due Date</Label><Input type="date" value={editRock?.due_date || ''} onChange={(e) => setEditRock({...editRock, due_date: e.target.value})} required /></div>
              </div>
              <Button type="submit" className="w-full">Save Rock</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ============ LINKS SIDEBAR ============
function LinksSidebar({ holdingAccountId, companies, profitCenters }) {
  const [scope, setScope] = useState('holding')
  const [scopeId, setScopeId] = useState(null)
  const [resources, setResources] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchResources = useCallback(async () => {
    setLoading(true)
    let url = `/api/resources?holding_account_id=${holdingAccountId}&scope_type=${scope}`
    if (scopeId) url += `&scope_id=${scopeId}`
    const res = await fetch(url)
    setResources(await res.json())
    setLoading(false)
  }, [holdingAccountId, scope, scopeId])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleAddResource = async () => {
    if (!newUrl.trim()) return
    await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, scope_type: scope, scope_id: scopeId, title: newTitle || newUrl, url: newUrl })
    })
    setNewTitle('')
    setNewUrl('')
    fetchResources()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/resources/${id}`, { method: 'DELETE' })
    fetchResources()
  }

  return (
    <div className="w-72 border-l bg-muted/30 p-4 space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" />Links & Docs</h3>
      
      <div className="space-y-2">
        <Select value={scope} onValueChange={(v) => { setScope(v); setScopeId(null) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="holding">Holding (Global)</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="profit_center">Profit Center</SelectItem>
          </SelectContent>
        </Select>
        
        {scope === 'company' && (
          <Select value={scopeId || ''} onValueChange={setScopeId}>
            <SelectTrigger><SelectValue placeholder="Select company..." /></SelectTrigger>
            <SelectContent>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        
        {scope === 'profit_center' && (
          <Select value={scopeId || ''} onValueChange={setScopeId}>
            <SelectTrigger><SelectValue placeholder="Select profit center..." /></SelectTrigger>
            <SelectContent>
              {profitCenters.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">No links yet</p>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 border rounded bg-white text-sm">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate flex-1">
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{r.title}</span>
              </a>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleDelete(r.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Input placeholder="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
        <Button size="sm" className="w-full" onClick={handleAddResource}><Plus className="h-4 w-4 mr-1" />Add Link</Button>
      </div>
    </div>
  )
}

// ============ PROGRESS PAGE ============
function ProgressView({ holdingAccountId, holdingAccount, onNavigate, onUpdateHoldingName, companies, profitCenters, teamMembers }) {
  const [completedCards, setCompletedCards] = useState([])
  const [completedRocks, setCompletedRocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('tasks')

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Fetch completed cards
    let cardUrl = `/api/kanban/cards?holding_account_id=${holdingAccountId}&completed=true`
    if (viewMode === 'month') cardUrl += `&month=${selectedMonth}&year=${selectedYear}`
    else cardUrl += `&year=${selectedYear}`
    const cardsRes = await fetch(cardUrl)
    setCompletedCards(await cardsRes.json())
    
    // Fetch completed rocks
    const rocksRes = await fetch(`/api/rocks?holding_account_id=${holdingAccountId}&status=completed`)
    setCompletedRocks(await rocksRes.json())
    setLoading(false)
  }, [holdingAccountId, viewMode, selectedMonth, selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="progress" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onNavigate('dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <h1 className="text-2xl font-bold">Progress</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === 'month' && (
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{format(new Date(2000, i), 'MMMM')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => (
                <SelectItem key={i} value={String(new Date().getFullYear() - 2 + i)}>{new Date().getFullYear() - 2 + i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{completedCards.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed Rocks</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">{completedRocks.length}</div></CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({completedCards.length})</TabsTrigger>
          <TabsTrigger value="rocks">Rocks ({completedRocks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : completedCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No completed tasks in this period</div>
              ) : (
                <div className="space-y-2">
                  {completedCards.map(card => {
                    const pc = profitCenters.find(p => p.id === card.profit_center_id)
                    const company = companies.find(c => c.id === card.company_id)
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{card.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {company?.name} / {pc?.name} • Completed: {card.completed_at ? new Date(card.completed_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {card.amount_cents && <Badge variant="outline">{formatCents(card.amount_cents)}</Badge>}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rocks">
          <Card>
            <CardContent className="pt-6">
              {completedRocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No completed rocks</div>
              ) : (
                <div className="space-y-2">
                  {completedRocks.map(rock => (
                    <div key={rock.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mountain className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{rock.title}</p>
                          <p className="text-xs text-muted-foreground">Completed: {rock.completed_at ? new Date(rock.completed_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
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

// ============ ROCKS PAGE ============
function RocksView({ holdingAccountId, holdingAccount, onNavigate, onUpdateHoldingName, companies, profitCenters, teamMembers }) {
  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="rocks" />
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold">Rocks (Quarterly Goals)</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RocksSection holdingAccountId={holdingAccountId} teamMembers={teamMembers} />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ PLAN PAGE (Aggregated Kanban) ============
function PlanView({ holdingAccountId, holdingAccount, onNavigate, onUpdateHoldingName, companies, profitCenters, teamMembers }) {
  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="plan" />
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate('dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold">Plan</h1>
      </div>

      {/* Rocks at top */}
      <Card>
        <CardContent className="pt-4">
          <RocksSection holdingAccountId={holdingAccountId} teamMembers={teamMembers} compact />
        </CardContent>
      </Card>

      {/* Kanban with filters */}
      <Card>
        <CardContent className="pt-6">
          <KanbanBoard 
            holdingAccountId={holdingAccountId} 
            title="All Tasks" 
            companies={companies} 
            profitCenters={profitCenters} 
            showFilters={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ SORTABLE COMPANY ITEM (Settings) ============
function SortableCompanyItem({ company, profitCenters, onEdit, onDelete, onAddPC, onDeletePC, newPC, setNewPC }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: company.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'ring-2 ring-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"><GripVertical className="h-5 w-5 text-muted-foreground" /></div>
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
function DashboardView({ holdingAccountId, holdingAccount, onSelectProfitCenter, onNavigate, onUpdateHoldingName, companies, profitCenters }) {
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
    <div className="flex">
      <div className="flex-1 space-y-4">
        <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="dashboard" />

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

      {/* Right Sidebar */}
      <LinksSidebar holdingAccountId={holdingAccountId} companies={companies} profitCenters={profitCenters} />
    </div>
  )
}

// ============ PROFIT CENTER DETAIL VIEW ============
function ProfitCenterDetail({ profitCenterId, holdingAccountId, holdingAccount, onBack, onUpdateHoldingName, onNavigate, companies, profitCenters, teamMembers }) {
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
      setCompany(companies.find(c => c.id === pcData.company_id))
    } catch (e) {
      console.error('Failed to fetch profit center data:', e)
    }
    setLoading(false)
  }, [profitCenterId, companies])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggleProjection = async () => {
    const newValue = !(profitCenter.include_in_projection !== false)
    await fetch(`/api/profit-centers/${profitCenterId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ include_in_projection: newValue }) })
    setProfitCenter({ ...profitCenter, include_in_projection: newValue })
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profit_center_id: profitCenterId, text: newNote }) })
    setNewNote('')
    fetchData()
  }

  const handleDeleteNote = async (id) => { await fetch(`/api/notes/${id}`, { method: 'DELETE' }); fetchData() }
  const handleAddOverhead = async (e) => {
    e.preventDefault()
    await fetch('/api/overhead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profit_center_id: profitCenterId, ...newOverhead, amount: parseFloat(newOverhead.amount) }) })
    setNewOverhead({ name: '', amount: '', frequency: 'monthly', note: '' })
    fetchData()
  }
  const handleDeleteOverhead = async (id) => { await fetch(`/api/overhead/${id}`, { method: 'DELETE' }); fetchData() }
  const handleDeleteTransaction = async (id) => { await fetch(`/api/transactions/${id}`, { method: 'DELETE' }); fetchData() }
  const handleUpdateTransaction = async (e) => {
    e.preventDefault()
    await fetch(`/api/transactions/${editTxn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txn_date: editTxn.txn_date, amount: parseFloat(editTxn.amount), description: editTxn.description, is_projected: editTxn.is_projected }) })
    setEditTxn(null)
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

  const includeInProjection = profitCenter?.include_in_projection !== false

  return (
    <div className="space-y-4">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="" />

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
            <Label htmlFor="projection-toggle" className="text-sm">Include in Run-Rate</Label>
          </div>
          <Switch id="projection-toggle" checked={includeInProjection} onCheckedChange={handleToggleProjection} />
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Plan</TabsTrigger>
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="overhead">Overhead ({overhead.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          {/* Rocks Section */}
          <Card>
            <CardContent className="pt-4">
              <RocksSection holdingAccountId={holdingAccountId} profitCenterId={profitCenterId} teamMembers={teamMembers} compact />
            </CardContent>
          </Card>
          
          {/* Kanban Board */}
          <Card>
            <CardContent className="pt-6">
              <KanbanBoard holdingAccountId={holdingAccountId} profitCenterId={profitCenterId} title={`${profitCenter?.name} Tasks`} companies={companies} profitCenters={profitCenters} />
            </CardContent>
          </Card>
        </TabsContent>

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
                    <Label htmlFor="edit_is_projected" className="text-sm cursor-pointer">Projected Revenue</Label>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
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

// ============ SETTINGS VIEW ============
function SettingsView({ holdingAccountId, holdingAccount, onBack, onUpdateHoldingName, onNavigate, companies: initialCompanies, profitCenters: initialPCs }) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [profitCenters, setProfitCenters] = useState(initialPCs)
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '', color: COMPANY_COLORS[0].value })
  const [newPC, setNewPC] = useState({ company_id: '', name: '' })
  const [editCompany, setEditCompany] = useState(null)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const fetchData = useCallback(async () => {
    const [compRes, pcRes, teamRes] = await Promise.all([
      fetch(`/api/companies?holding_account_id=${holdingAccountId}`),
      fetch(`/api/profit-centers?holding_account_id=${holdingAccountId}`),
      fetch(`/api/team?holding_account_id=${holdingAccountId}`)
    ])
    setCompanies(await compRes.json())
    setProfitCenters(await pcRes.json())
    setTeamMembers(await teamRes.json())
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

  const handleDeleteCompany = async (id) => { await fetch(`/api/companies/${id}`, { method: 'DELETE' }); fetchData() }

  const handleAddProfitCenter = async (companyId) => {
    if (newPC.company_id !== companyId || !newPC.name) return
    await fetch('/api/profit-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holding_account_id: holdingAccountId, company_id: companyId, name: newPC.name }) })
    setNewPC({ company_id: '', name: '' })
    fetchData()
  }

  const handleDeleteProfitCenter = async (id) => { await fetch(`/api/profit-centers/${id}`, { method: 'DELETE' }); fetchData() }

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

  const handleAddTeamMember = async (e) => {
    e.preventDefault()
    if (!newMemberEmail.trim()) return
    await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holding_account_id: holdingAccountId, email: newMemberEmail, name: newMemberName, role: newMemberRole })
    })
    setNewMemberEmail('')
    setNewMemberName('')
    setNewMemberRole('member')
    fetchData()
  }

  const handleDeleteMember = async (id) => { await fetch(`/api/team/${id}`, { method: 'DELETE' }); fetchData() }

  const handleMigrate = async () => {
    if (!confirm('This will reset your Kanban columns to defaults and fix duplicates. Continue?')) return
    setLoading(true)
    await fetch('/api/kanban/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holding_account_id: holdingAccountId }) })
    setLoading(false)
    alert('Migration complete!')
  }

  const activeCompanies = companies.filter(c => c.active !== false)

  return (
    <div className="space-y-6">
      <DashboardHeader holdingAccount={holdingAccount} onUpdateName={onUpdateHoldingName} onNavigate={onNavigate} currentView="settings" />
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">Companies & Profit Centers</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
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

          {activeCompanies.length > 1 && <div className="flex items-center gap-2 text-sm text-muted-foreground"><GripVertical className="h-4 w-4" /><span>Drag companies to reorder</span></div>}

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
                      <SelectTrigger><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: editCompany.color }}></div></div></SelectTrigger>
                      <SelectContent>{COLUMN_COLORS.map(c => (<SelectItem key={c.value} value={c.value}><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: c.value }}></div><span>{c.name}</span></div></SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team Members</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTeamMember} className="flex gap-2">
                <Input placeholder="Name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="flex-1" />
                <Input placeholder="Email" type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="flex-1" required />
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit"><Plus className="h-4 w-4 mr-1" />Invite</Button>
              </form>
              <Separator />
              {teamMembers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No team members yet</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{member.name || member.email}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>{member.status}</Badge>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteMember(member.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle>Maintenance</CardTitle><CardDescription>Database maintenance and migrations</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Fix Kanban Columns</h4>
                <p className="text-sm text-muted-foreground mb-3">Reset Kanban columns to default (Idea, Started, 50% Done, 75% Done, Finished) and fix any duplicate columns.</p>
                <Button variant="outline" onClick={handleMigrate} disabled={loading}>{loading ? 'Migrating...' : 'Run Migration'}</Button>
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
  const [companies, setCompanies] = useState([])
  const [profitCenters, setProfitCenters] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [newAccountName, setNewAccountName] = useState('')

  const fetchBaseData = useCallback(async (accountId) => {
    const [compRes, pcRes, teamRes] = await Promise.all([
      fetch(`/api/companies?holding_account_id=${accountId}`),
      fetch(`/api/profit-centers?holding_account_id=${accountId}`),
      fetch(`/api/team?holding_account_id=${accountId}`)
    ])
    setCompanies(await compRes.json())
    setProfitCenters(await pcRes.json())
    setTeamMembers(await teamRes.json())
  }, [])

  useEffect(() => {
    fetch('/api/holding-accounts').then(res => res.json()).then(accounts => {
      if (accounts.length > 0) {
        setHoldingAccountId(accounts[0].id)
        setHoldingAccount(accounts[0])
        fetchBaseData(accounts[0].id)
        setView('dashboard')
      } else {
        setView('onboarding')
      }
    }).catch(() => setView('onboarding'))
  }, [fetchBaseData])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    const res = await fetch('/api/holding-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newAccountName || 'My Business' }) })
    const account = await res.json()
    setHoldingAccountId(account.id)
    setHoldingAccount(account)
    fetchBaseData(account.id)
    setView('dashboard')
  }

  const handleUpdateHoldingName = async (name) => {
    await fetch(`/api/holding-accounts/${holdingAccountId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const res = await fetch(`/api/holding-accounts/${holdingAccountId}`)
    setHoldingAccount(await res.json())
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
        {view === 'dashboard' && <DashboardView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onSelectProfitCenter={handleSelectProfitCenter} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} />}
        {view === 'profit-center' && <ProfitCenterDetail profitCenterId={selectedProfitCenterId} holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} teamMembers={teamMembers} />}
        {view === 'plan' && <PlanView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} teamMembers={teamMembers} />}
        {view === 'progress' && <ProgressView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} teamMembers={teamMembers} />}
        {view === 'rocks' && <RocksView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} teamMembers={teamMembers} />}
        {view === 'settings' && <SettingsView holdingAccountId={holdingAccountId} holdingAccount={holdingAccount} onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} onUpdateHoldingName={handleUpdateHoldingName} companies={companies} profitCenters={profitCenters} />}
      </div>
    </div>
  )
}
