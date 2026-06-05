'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Calendar, MoreVertical, Trash2,
  Loader2, RefreshCw, Activity, CheckCircle2, Clock, Syringe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import Swal from 'sweetalert2'

interface Campaign {
  id_campaign: number; nom: string; code: string; description?: string
  type_campagne: string; date_debut: string; date_fin: string
  actif: boolean; sexe: string; nombre_dose: number
  age_min?: number; age_max?: number; created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  VACCINATION:    'Vaccination',
  DEPISTAGE:      'Dépistage',
  SUPPLEMENTATION:'Supplémentation',
  SENSIBILISATION:'Sensibilisation',
  TRAITEMENT:     'Traitement',
}

const TYPE_COLORS: Record<string, string> = {
  VACCINATION:    'bg-sky-500/15 text-sky-300 border-sky-500/30',
  DEPISTAGE:      'bg-violet-500/15 text-violet-300 border-violet-500/30',
  SUPPLEMENTATION:'bg-amber-500/15 text-amber-300 border-amber-500/30',
  SENSIBILISATION:'bg-teal-500/15 text-teal-300 border-teal-500/30',
  TRAITEMENT:     'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

const EMPTY_FORM = {
  nom: '', code: '', description: '', type_campagne: 'VACCINATION',
  date_debut: '', date_fin: '', sexe: 'ALL', nombre_dose: 1,
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const isActive = (c: Campaign) => {
  const now = new Date(); const start = new Date(c.date_debut); const end = new Date(c.date_fin)
  return c.actif && now >= start && now <= end
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setType]     = useState('all')
  const [dialogOpen, setDialog]   = useState(false)
  const [submitting, setSub]      = useState(false)
  const [form, setForm]           = useState({ ...EMPTY_FORM })

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/campaigns')
      setCampaigns(res.data.items ?? [])
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les campagnes.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = `${c.nom} ${c.code} ${c.description ?? ''}`.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || c.type_campagne === typeFilter
    return matchSearch && matchType
  })

  const handleCreate = async () => {
    if (!form.nom || !form.code || !form.type_campagne || !form.date_debut || !form.date_fin) {
      Swal.fire({ icon: 'warning', title: 'Champs requis',
        text: 'Nom, code, type et dates sont obligatoires.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
      return
    }
    setSub(true)
    try {
      await api.post('/campaigns', {
        nom: form.nom, code: form.code,
        description: form.description || undefined,
        type_campagne: form.type_campagne,
        date_debut: form.date_debut, date_fin: form.date_fin,
        sexe: form.sexe, nombre_dose: Number(form.nombre_dose),
        actif: true, molecule_ids: [], zones: [],
      })
      Swal.fire({ icon: 'success', title: 'Campagne créée !', timer: 1500,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      setForm({ ...EMPTY_FORM })
      setDialog(false)
      fetchCampaigns()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erreur',
        text: err.response?.data?.detail || 'Échec de la création.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setSub(false) }
  }

  const handleDelete = async (c: Campaign) => {
    const res = await Swal.fire({
      title: `Supprimer « ${c.nom} » ?`,
      text: 'Cette action est irréversible.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#EF4444', cancelButtonColor: '#334155',
      confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler',
      background: '#0D1B2E', color: '#E2EAF2',
    })
    if (!res.isConfirmed) return
    try {
      await api.delete(`/campaigns/${c.id_campaign}`)
      Swal.fire({ icon: 'success', title: 'Supprimée !', timer: 1200,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      fetchCampaigns()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erreur',
        text: err.response?.data?.detail || 'Suppression impossible.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    }
  }

  const stats = [
    { label: 'Total',   value: campaigns.length,                 icon: Activity,      color: 'text-sky-400',    bg: 'bg-sky-500/10' },
    { label: 'En cours', value: campaigns.filter(isActive).length, icon: Clock,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Actives', value: campaigns.filter(c => c.actif).length, icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Vaccinations', value: campaigns.filter(c => c.type_campagne === 'VACCINATION').length, icon: Syringe, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Campagnes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Créez et suivez les campagnes de santé
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchCampaigns} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> Nouvelle Campagne
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Créer une Campagne</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nom <span className="text-red-400">*</span></Label>
                    <Input placeholder="Campagne Polio 2025" value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label>Code <span className="text-red-400">*</span></Label>
                    <Input placeholder="POLIO-2025-01" value={form.code}
                      onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea placeholder="Objectifs de la campagne..." rows={2} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="bg-muted border-border resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Type <span className="text-red-400">*</span></Label>
                    <Select value={form.type_campagne} onValueChange={v => setForm(f => ({ ...f, type_campagne: v }))}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(TYPE_LABELS).map(([k, v]) =>
                          <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Sexe cible</Label>
                    <Select value={form.sexe} onValueChange={v => setForm(f => ({ ...f, sexe: v }))}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="ALL">Tous</SelectItem>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date début <span className="text-red-400">*</span></Label>
                    <Input type="date" value={form.date_debut}
                      onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label>Date fin <span className="text-red-400">*</span></Label>
                    <Input type="date" value={form.date_fin}
                      onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Nombre de doses</Label>
                  <Input type="number" min={1} value={form.nombre_dose}
                    onChange={e => setForm(f => ({ ...f, nombre_dose: parseInt(e.target.value) || 1 }))}
                    className="bg-muted border-border w-32" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialog(false)}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer la campagne'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <Card key={i} className="border-border">
              <CardContent className="flex items-center gap-3 pt-4 pb-4">
                <div className={cn('p-2.5 rounded-xl', s.bg)}>
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, code..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border focus:border-primary" />
        </div>
        <Select value={typeFilter} onValueChange={setType}>
          <SelectTrigger className="w-[180px] bg-muted border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) =>
              <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Chargement des campagnes...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-muted-foreground font-medium">Campagne</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Période</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Sexe</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Doses</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Statut</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id_campaign} className="border-border hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">{c.nom}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
                        {c.description && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{c.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline"
                        className={cn('text-xs', TYPE_COLORS[c.type_campagne] ?? 'bg-muted text-foreground')}>
                        {TYPE_LABELS[c.type_campagne] ?? c.type_campagne}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-foreground">
                          <Calendar className="h-3 w-3 text-primary/60" />
                          {fmtDate(c.date_debut)}
                        </div>
                        <div className="text-muted-foreground pl-4">→ {fmtDate(c.date_fin)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {c.sexe === 'ALL' ? 'Tous' : c.sexe === 'M' ? 'Masculin' : 'Féminin'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{c.nombre_dose}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs',
                        isActive(c)
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : c.actif
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                      )}>
                        {isActive(c) ? 'En cours' : c.actif ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem onClick={() => handleDelete(c)}
                            className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
              <Calendar className="h-10 w-10 opacity-30" />
              <p className="text-sm">Aucune campagne trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} campagne{filtered.length > 1 ? 's' : ''}
          {filtered.length !== campaigns.length && ` sur ${campaigns.length}`}
        </p>
      )}
    </div>
  )
}
