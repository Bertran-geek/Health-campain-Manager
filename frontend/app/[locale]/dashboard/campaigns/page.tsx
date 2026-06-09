'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Calendar, Trash2, Eye, Pencil, Loader2, RefreshCw, Activity, CheckCircle2, Clock, Syringe, X, FlaskConical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import Swal from 'sweetalert2'
import { useTranslations } from 'next-intl'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Molecule { id_molecule: number; nom: string; code: string; description?: string; nombre_dose_standard: number }
interface CampaignZone { id_zone?: number; niveau: string; id_region?: number; id_dpt?: number; id_phc?: number }
interface Campaign {
  id_campaign: number; nom: string; code: string; description?: string
  type_campagne: string; date_debut: string; date_fin: string
  actif: boolean; sexe: string; nombre_dose: number
  age_min?: number; age_max?: number; total_personne?: number; created_at: string
  molecules: Molecule[]; zones: CampaignZone[]
}
interface Region { id_region: number; nom_region: string }
interface Department { id_dpt: number; nom_dpt: string; id_region: number }
type FormData = { nom: string; code: string; description: string; type_campagne: string; date_debut: string; date_fin: string; sexe: string; nombre_dose: number; age_min: string; age_max: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABEL_KEYS: Record<string, string> = { VACCINATION: 'typeVaccination', DEPISTAGE: 'typeDepistage', SUPPLEMENTATION: 'typeSupplementation', SENSIBILISATION: 'typeSensibilisation', TRAITEMENT: 'typeTraitement' }
const TYPE_COLORS: Record<string, string> = { VACCINATION: 'bg-sky-500/15 text-sky-300 border-sky-500/30', DEPISTAGE: 'bg-violet-500/15 text-violet-300 border-violet-500/30', SUPPLEMENTATION: 'bg-amber-500/15 text-amber-300 border-amber-500/30', SENSIBILISATION: 'bg-teal-500/15 text-teal-300 border-teal-500/30', TRAITEMENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
const EMPTY: FormData = { nom: '', code: '', description: '', type_campagne: 'VACCINATION', date_debut: '', date_fin: '', sexe: 'ALL', nombre_dose: 1, age_min: '', age_max: '' }
const SWL = { background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' }
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const isActive = (c: Campaign) => { const n = new Date(), s = new Date(c.date_debut), e = new Date(c.date_fin); return c.actif && n >= s && n <= e }

// ─── Zone Builder sub-component ───────────────────────────────────────────────
function ZoneBuilder({ zones, onChange, regions, allDepts }: { zones: CampaignZone[]; onChange: (z: CampaignZone[]) => void; regions: Region[]; allDepts: Department[] }) {
  const t = useTranslations('Campaigns')
  const [level, setLevel] = useState('REGION')
  const [regionFilter, setRegionFilter] = useState('')
  const [entityId, setEntityId] = useState('')
  const depts = regionFilter ? allDepts.filter(d => d.id_region === parseInt(regionFilter)) : allDepts
  const add = () => {
    if (!entityId) return
    const id = parseInt(entityId)
    const z: CampaignZone = level === 'REGION' ? { niveau: 'REGION', id_region: id } : { niveau: 'DEPARTEMENT', id_region: allDepts.find(d => d.id_dpt === id)?.id_region, id_dpt: id }
    if (!zones.some(x => x.niveau === z.niveau && x.id_region === z.id_region && x.id_dpt === z.id_dpt)) onChange([...zones, z])
    setEntityId('')
  }
  const label = (z: CampaignZone) => z.niveau === 'REGION' ? `🌍 ${regions.find(r => r.id_region === z.id_region)?.nom_region ?? z.id_region}` : `📍 ${allDepts.find(d => d.id_dpt === z.id_dpt)?.nom_dpt ?? z.id_dpt}`
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Select value={level} onValueChange={v => { setLevel(v); setEntityId(''); setRegionFilter('') }}>
          <SelectTrigger className="bg-muted border-white/20 text-white w-36"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-white/20"><SelectItem value="REGION">{t('zoneRegion')}</SelectItem><SelectItem value="DEPARTEMENT">{t('zoneDepartement')}</SelectItem></SelectContent>
        </Select>
        {level === 'DEPARTEMENT' && (
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="bg-muted border-white/20 text-white w-40"><SelectValue placeholder={t('filterRegion')} /></SelectTrigger>
            <SelectContent className="bg-card border-white/20"><SelectItem value="">{t('allRegions')}</SelectItem>{regions.map(r => <SelectItem key={r.id_region} value={String(r.id_region)}>{r.nom_region}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Select value={entityId} onValueChange={setEntityId}>
          <SelectTrigger className="bg-muted border-white/20 text-white flex-1 min-w-[160px]"><SelectValue placeholder={level === 'REGION' ? t('pickRegion') : t('pickDept')} /></SelectTrigger>
          <SelectContent className="bg-card border-white/20">{level === 'REGION' ? regions.map(r => <SelectItem key={r.id_region} value={String(r.id_region)}>{r.nom_region}</SelectItem>) : depts.map(d => <SelectItem key={d.id_dpt} value={String(d.id_dpt)}>{d.nom_dpt}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" onClick={add} disabled={!entityId} className="bg-primary hover:bg-primary/80 text-white px-3"><Plus className="h-4 w-4" /></Button>
      </div>
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded border border-white/10">
          {zones.map((z, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-white text-xs rounded-full border border-white/20">
              {label(z)}
              <button type="button" onClick={() => onChange(zones.filter((_, j) => j !== i))} className="text-white/50 hover:text-white ml-0.5"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Molecule Selector sub-component ─────────────────────────────────────────
function MoleculeSelector({ selected, onChange, molecules, onRefresh }: { selected: number[]; onChange: (ids: number[]) => void; molecules: Molecule[]; onRefresh: () => Promise<void> }) {
  const t = useTranslations('Campaigns')
  const [showCreate, setShowCreate] = useState(false)
  const [f, setF] = useState({ code: '', nom: '', description: '', nombre_dose_standard: 1 })
  const [creating, setCreating] = useState(false)
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id])
  const create = async () => {
    if (!f.code || !f.nom) { Swal.fire({ icon: 'warning', title: t('error'), text: t('moleculeRequired'), ...SWL }); return }
    setCreating(true)
    try {
      const res = await api.post('/molecules', { ...f, nombre_dose_standard: Number(f.nombre_dose_standard) })
      Swal.fire({ icon: 'success', title: t('moleculeCreated'), timer: 1200, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      await onRefresh(); onChange([...selected, res.data.id_molecule])
      setF({ code: '', nom: '', description: '', nombre_dose_standard: 1 }); setShowCreate(false)
    } catch (err: any) { Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('moleculeError'), ...SWL })
    } finally { setCreating(false) }
  }
  return (
    <div className="space-y-2">
      <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-muted/30 rounded border border-white/10">
        {molecules.length === 0 && <p className="text-white/40 text-xs text-center py-2">{t('noMoleculeAvailable')}</p>}
        {molecules.map(m => (
          <div key={m.id_molecule} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5" onClick={() => toggle(m.id_molecule)}>
            <Checkbox checked={selected.includes(m.id_molecule)} onCheckedChange={() => toggle(m.id_molecule)} className="border-white/30" />
            <span className="text-white text-sm">{m.nom}</span>
            <span className="text-white/40 text-xs ml-auto font-mono">{m.code}</span>
          </div>
        ))}
      </div>
      {!showCreate ? (
        <Button type="button" variant="outline" size="sm" className="border-dashed border-white/30 text-white/70 hover:text-white hover:bg-white/10 w-full" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" /> {t('createMolecule')}
        </Button>
      ) : (
        <div className="p-3 bg-muted/30 rounded border border-white/20 space-y-2">
          <p className="text-white text-xs font-semibold">{t('newMoleculeLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Code" value={f.code} onChange={e => setF(x => ({ ...x, code: e.target.value }))} className="bg-muted border-white/20 text-white placeholder:text-white/30 text-sm h-8" />
            <Input placeholder="Nom" value={f.nom} onChange={e => setF(x => ({ ...x, nom: e.target.value }))} className="bg-muted border-white/20 text-white placeholder:text-white/30 text-sm h-8" />
          </div>
          <Input placeholder={t('descOptional')} value={f.description} onChange={e => setF(x => ({ ...x, description: e.target.value }))} className="bg-muted border-white/20 text-white placeholder:text-white/30 text-sm h-8" />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" className="text-white/60 h-7" onClick={() => setShowCreate(false)}>{t('cancel')}</Button>
            <Button type="button" size="sm" onClick={create} disabled={creating} className="bg-primary hover:bg-primary/80 text-white h-7">{creating ? <Loader2 className="h-3 w-3 animate-spin" /> : t('addBtn')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Campaign Form Fields sub-component ──────────────────────────────────────
function CampaignFields({ form, set }: { form: FormData; set: (p: Partial<FormData>) => void }) {
  const t = useTranslations('Campaigns')
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-white">{t('nameLabel')} <span className="text-red-400">*</span></Label><Input value={form.nom} onChange={e => set({ nom: e.target.value })} placeholder="Campagne Polio" className="bg-muted border-white/20 text-white placeholder:text-white/30" /></div>
        <div className="space-y-1"><Label className="text-white">{t('codeLabel')} <span className="text-red-400">*</span></Label><Input value={form.code} onChange={e => set({ code: e.target.value })} placeholder="POLIO-2025" className="bg-muted border-white/20 text-white placeholder:text-white/30" /></div>
      </div>
      <div className="space-y-1"><Label className="text-white">{t('descriptionLabel')}</Label><Textarea value={form.description} onChange={e => set({ description: e.target.value })} rows={2} className="bg-muted border-white/20 text-white resize-none placeholder:text-white/30" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-white">{t('typeLabel')} <span className="text-red-400">*</span></Label>
          <Select value={form.type_campagne} onValueChange={v => set({ type_campagne: v })}>
            <SelectTrigger className="bg-muted border-white/20 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-white/20">{Object.keys(TYPE_LABEL_KEYS).map(k => <SelectItem key={k} value={k}>{t(TYPE_LABEL_KEYS[k] as any)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-white">{t('genderLabel')}</Label>
          <Select value={form.sexe} onValueChange={v => set({ sexe: v })}>
            <SelectTrigger className="bg-muted border-white/20 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-white/20"><SelectItem value="ALL">{t('genderAll')}</SelectItem><SelectItem value="M">{t('genderM')}</SelectItem><SelectItem value="F">{t('genderF')}</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-white">{t('startDate')} <span className="text-red-400">*</span></Label><Input type="date" value={form.date_debut} onChange={e => set({ date_debut: e.target.value })} className="bg-muted border-white/20 text-white" /></div>
        <div className="space-y-1"><Label className="text-white">{t('endDate')} <span className="text-red-400">*</span></Label><Input type="date" value={form.date_fin} onChange={e => set({ date_fin: e.target.value })} className="bg-muted border-white/20 text-white" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label className="text-white">{t('dosesLabel')}</Label><Input type="number" min={1} value={form.nombre_dose} onChange={e => set({ nombre_dose: parseInt(e.target.value) || 1 })} className="bg-muted border-white/20 text-white" /></div>
        <div className="space-y-1"><Label className="text-white">{t('ageMin')}</Label><Input type="number" min={0} value={form.age_min} onChange={e => set({ age_min: e.target.value })} className="bg-muted border-white/20 text-white" /></div>
        <div className="space-y-1"><Label className="text-white">{t('ageMax')}</Label><Input type="number" min={0} value={form.age_max} onChange={e => set({ age_max: e.target.value })} className="bg-muted border-white/20 text-white" /></div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const t = useTranslations('Campaigns')
  // Lists
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [molecules, setMolecules] = useState<Molecule[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [allDepts, setAllDepts] = useState<Department[]>([])
  // UI
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setType] = useState('all')
  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<FormData>({ ...EMPTY })
  const [selMols, setSelMols] = useState<number[]>([])
  const [selZones, setSelZones] = useState<CampaignZone[]>([])
  const [submitting, setSub] = useState(false)
  // View
  const [viewC, setViewC] = useState<Campaign | null>(null)
  // Edit
  const [editC, setEditC] = useState<Campaign | null>(null)
  const [editForm, setEditForm] = useState<FormData>({ ...EMPTY })
  const [editMols, setEditMols] = useState<number[]>([])
  const [editZones, setEditZones] = useState<CampaignZone[]>([])
  const [editSub, setEditSub] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/campaigns?page=1&page_size=100'); setCampaigns(r.data.items ?? []) }
    catch { Swal.fire({ icon: 'error', title: t('error'), text: t('noCampaigns'), ...SWL }) }
    finally { setLoading(false) }
  }, [])
  const fetchMolecules = useCallback(async () => {
    try { const r = await api.get('/molecules'); setMolecules(r.data) } catch {}
  }, [])
  const fetchRegions = useCallback(async () => {
    try { const r = await api.get('/regions?page_size=100'); setRegions(r.data.items ?? []) } catch {}
  }, [])
  const fetchDepts = useCallback(async () => {
    try { const r = await api.get('/departements?page_size=500'); setAllDepts(r.data.items ?? []) } catch {}
  }, [])

  useEffect(() => { fetchCampaigns(); fetchMolecules(); fetchRegions(); fetchDepts() }, [fetchCampaigns, fetchMolecules, fetchRegions, fetchDepts])

  const filtered = campaigns.filter(c =>
    `${c.nom} ${c.code} ${c.description ?? ''}`.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'all' || c.type_campagne === typeFilter)
  )

  const openEdit = (c: Campaign) => {
    setEditC(c)
    setEditForm({ nom: c.nom, code: c.code, description: c.description ?? '', type_campagne: c.type_campagne, date_debut: c.date_debut?.split('T')[0] ?? '', date_fin: c.date_fin?.split('T')[0] ?? '', sexe: c.sexe, nombre_dose: c.nombre_dose, age_min: String(c.age_min ?? ''), age_max: String(c.age_max ?? '') })
    setEditMols(c.molecules.map(m => m.id_molecule))
    setEditZones(c.zones)
  }

  const handleCreate = async () => {
    if (!form.nom || !form.code || !form.date_debut || !form.date_fin) { Swal.fire({ icon: 'warning', title: t('error'), text: t('requiredFields'), ...SWL }); return }
    setSub(true)
    try {
      await api.post('/campaigns', { ...form, nombre_dose: Number(form.nombre_dose), age_min: form.age_min !== '' ? Number(form.age_min) : undefined, age_max: form.age_max !== '' ? Number(form.age_max) : undefined, actif: true, molecule_ids: selMols, zones: selZones })
      Swal.fire({ icon: 'success', title: t('campaignCreated'), timer: 1500, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      setForm({ ...EMPTY }); setSelMols([]); setSelZones([]); setCreateOpen(false); fetchCampaigns()
    } catch (err: any) { Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('createError'), ...SWL })
    } finally { setSub(false) }
  }

  const handleUpdate = async () => {
    if (!editC) return
    setEditSub(true)
    try {
      await api.put(`/campaigns/${editC.id_campaign}`, { ...editForm, nombre_dose: Number(editForm.nombre_dose), age_min: editForm.age_min !== '' ? Number(editForm.age_min) : undefined, age_max: editForm.age_max !== '' ? Number(editForm.age_max) : undefined, molecule_ids: editMols, zones: editZones })
      Swal.fire({ icon: 'success', title: t('campaignUpdated'), timer: 1500, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      setEditC(null); fetchCampaigns()
    } catch (err: any) { Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('updateError'), ...SWL })
    } finally { setEditSub(false) }
  }

  const handleDelete = async (c: Campaign) => {
    const r = await Swal.fire({ title: t('deleteConfirmTitle', {name: c.nom}), text: t('deleteConfirmText'), icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#334155', confirmButtonText: t('deleteBtn'), cancelButtonText: t('cancelBtn'), ...SWL })
    if (!r.isConfirmed) return
    try {
      await api.delete(`/campaigns/${c.id_campaign}`)
      Swal.fire({ icon: 'success', title: t('campaignDeleted'), timer: 1200, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      fetchCampaigns()
    } catch (err: any) { Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('deleteError'), ...SWL }) }
  }

  const stats = [
    { label: t('total'), value: campaigns.length, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: t('inProgress'), value: campaigns.filter(isActive).length, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: t('active'), value: campaigns.filter(c => c.actif).length, icon: CheckCircle2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: t('vaccinations'), value: campaigns.filter(c => c.type_campagne === 'VACCINATION').length, icon: Syringe, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/60 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchCampaigns} className="border-white/20 text-white hover:bg-white/10"><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2"><Plus className="h-4 w-4" /> {t('newCampaign')}</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => { const Icon = s.icon; return (
          <Card key={i} className="border-white/20 bg-card">
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className={cn('p-2.5 rounded-xl', s.bg)}><Icon className={cn('h-5 w-5', s.color)} /></div>
              <div><div className={cn('text-2xl font-bold', s.color)}>{s.value}</div><div className="text-xs text-white/50">{s.label}</div></div>
            </CardContent>
          </Card>
        )})}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input placeholder={t('searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-white/20 text-white placeholder:text-white/30" />
        </div>
        <Select value={typeFilter} onValueChange={setType}>
          <SelectTrigger className="w-[180px] bg-muted border-white/20 text-white"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-card border-white/20"><SelectItem value="all">{t('allTypes')}</SelectItem>{Object.keys(TYPE_LABEL_KEYS).map(k => <SelectItem key={k} value={k}>{t(TYPE_LABEL_KEYS[k] as any)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-white/20 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-white/50"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span>{t('loading')}</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 bg-white/5 hover:bg-white/5">
                  <TableHead className="text-white font-medium">{t('columnCampaign')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnType')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnPeriod')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnGender')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnDoses')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnStatus')}</TableHead>
                  <TableHead className="text-white font-medium text-center w-[120px]">{t('columnActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id_campaign} className="border-white/20 hover:bg-white/5">
                    <TableCell><div><p className="font-medium text-white text-sm">{c.nom}</p><p className="text-xs text-white/50 font-mono">{c.code}</p>{c.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{c.description}</p>}</div></TableCell>
                    <TableCell><Badge variant="outline" className={cn('text-xs', TYPE_COLORS[c.type_campagne])}>{TYPE_LABEL_KEYS[c.type_campagne] ? t(TYPE_LABEL_KEYS[c.type_campagne] as any) : c.type_campagne}</Badge></TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5 text-white">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-white/40" />{fmtDate(c.date_debut)}</div>
                        <div className="text-white/40 pl-4">→ {fmtDate(c.date_fin)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white text-xs">{c.sexe === 'ALL' ? t('genderAll') : c.sexe === 'M' ? t('genderM') : t('genderF')}</TableCell>
                    <TableCell className="text-white text-sm font-medium">{c.nombre_dose}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('text-xs', isActive(c) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : c.actif ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30')}>{isActive(c) ? t('statusInProgress') : c.actif ? t('statusActive') : t('statusInactive')}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300" title="Voir détails" onClick={() => setViewC(c)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" title="Modifier" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300" title="Supprimer" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3"><Calendar className="h-10 w-10 opacity-30" /><p className="text-sm">{t('noCampaigns')}</p></div>
          )}
        </CardContent>
      </Card>
      {!loading && <p className="text-xs text-white/30 text-right">{filtered.length} campagne{filtered.length > 1 ? 's' : ''}{filtered.length !== campaigns.length && ` sur ${campaigns.length}`}</p>}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[640px] bg-card border-white/20 text-white">
          <DialogHeader><DialogTitle className="text-white">{t('createTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <CampaignFields form={form} set={p => setForm(f => ({ ...f, ...p }))} />
            <div className="space-y-1"><Label className="text-white">{t('zonesLabel')}</Label><ZoneBuilder zones={selZones} onChange={setSelZones} regions={regions} allDepts={allDepts} /></div>
            <div className="space-y-1"><Label className="text-white">{t('moleculesLabel')}</Label><MoleculeSelector selected={selMols} onChange={setSelMols} molecules={molecules} onRefresh={fetchMolecules} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-primary hover:bg-primary/90 text-white">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('creating')}</> : t('createBtn')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ── */}
      <Dialog open={!!viewC} onOpenChange={() => setViewC(null)}>
        <DialogContent className="sm:max-w-[560px] bg-card border-white/20 text-white">
          <DialogHeader><DialogTitle className="text-white">{t('detailsTitle')}</DialogTitle></DialogHeader>
          {viewC && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-white/50 text-xs mb-0.5">{t('nameLabel')}</p><p className="text-white font-medium">{viewC.nom}</p></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('codeLabel')}</p><p className="text-white font-mono">{viewC.code}</p></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('typeLabel')}</p><Badge variant="outline" className={cn('text-xs', TYPE_COLORS[viewC.type_campagne])}>{TYPE_LABEL_KEYS[viewC.type_campagne] ? t(TYPE_LABEL_KEYS[viewC.type_campagne] as any) : viewC.type_campagne}</Badge></div>
                <div><p className="text-white/50 text-xs mb-0.5">Statut</p><Badge variant="outline" className={cn('text-xs', isActive(viewC) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : viewC.actif ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30')}>{isActive(viewC) ? t('statusInProgress') : viewC.actif ? t('statusActive') : t('statusInactive')}</Badge></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('startDate')}</p><p className="text-white">{fmtDate(viewC.date_debut)}</p></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('endDate')}</p><p className="text-white">{fmtDate(viewC.date_fin)}</p></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('genderLabel')}</p><p className="text-white">{viewC.sexe === 'ALL' ? t('genderAll') : viewC.sexe === 'M' ? t('genderM') : t('genderF')}</p></div>
                <div><p className="text-white/50 text-xs mb-0.5">{t('dosesLabel')}</p><p className="text-white">{viewC.nombre_dose}</p></div>
                {viewC.age_min != null && <div><p className="text-white/50 text-xs mb-0.5">{t('ageMin')}</p><p className="text-white">{viewC.age_min} ans</p></div>}
                {viewC.age_max != null && <div><p className="text-white/50 text-xs mb-0.5">{t('ageMax')}</p><p className="text-white">{viewC.age_max} ans</p></div>}
              </div>
              {viewC.description && <div><p className="text-white/50 text-xs mb-1">{t('descriptionLabel')}</p><p className="text-white text-sm">{viewC.description}</p></div>}
              <div>
                <p className="text-white/50 text-xs mb-1">{t('moleculesCount')} ({viewC.molecules.length})</p>
                {viewC.molecules.length === 0 ? <p className="text-white/30 text-xs">{t('noMolecule')}</p> : <div className="flex flex-wrap gap-1.5">{viewC.molecules.map(m => <span key={m.id_molecule} className="px-2 py-0.5 bg-sky-500/15 text-sky-300 text-xs rounded border border-sky-500/30">{m.nom} <span className="text-white/40 font-mono">({m.code})</span></span>)}</div>}
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">{t('zonesCount')} ({viewC.zones.length})</p>
                {viewC.zones.length === 0 ? <p className="text-white/30 text-xs">{t('noZone')}</p> : <div className="flex flex-wrap gap-1.5">{viewC.zones.map((z, i) => <span key={i} className="px-2 py-0.5 bg-primary/20 text-white text-xs rounded border border-white/20">{z.niveau}{z.id_region ? ` #${z.id_region}` : ''}</span>)}</div>}
              </div>
              <p className="text-xs text-white/30">{t('createdOn')} {fmtDate(viewC.created_at)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editC} onOpenChange={() => setEditC(null)}>
        <DialogContent className="sm:max-w-[640px] bg-card border-white/20 text-white">
          <DialogHeader><DialogTitle className="text-white">{t('editTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <CampaignFields form={editForm} set={p => setEditForm(f => ({ ...f, ...p }))} />
            <div className="space-y-1"><Label className="text-white">{t('zonesLabel')}</Label><ZoneBuilder zones={editZones} onChange={setEditZones} regions={regions} allDepts={allDepts} /></div>
            <div className="space-y-1"><Label className="text-white">{t('moleculesLabel')}</Label><MoleculeSelector selected={editMols} onChange={setEditMols} molecules={molecules} onRefresh={fetchMolecules} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setEditC(null)}>{t('cancel')}</Button>
              <Button onClick={handleUpdate} disabled={editSub} className="bg-primary hover:bg-primary/90 text-white">{editSub ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('saving')}</> : t('saveBtn')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
