'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, Pencil, Loader2, RefreshCw, FlaskConical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import Swal from 'sweetalert2'
import { useTranslations } from 'next-intl'

interface Molecule {
  id_molecule: number; nom: string; code: string; description?: string; nombre_dose_standard: number
}

const SWL = { background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' }
const EMPTY = { code: '', nom: '', description: '', nombre_dose_standard: 1 }

export default function MoleculesPage() {
  const t = useTranslations('Molecules')
  const [molecules, setMolecules] = useState<Molecule[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [submitting, setSub] = useState(false)

  const [editM, setEditM] = useState<Molecule | null>(null)
  const [editForm, setEditForm] = useState({ ...EMPTY })
  const [editSub, setEditSub] = useState(false)

  const fetchMolecules = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/molecules'); setMolecules(r.data) }
    catch { Swal.fire({ icon: 'error', title: t('error'), text: t('loadError'), ...SWL }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMolecules() }, [fetchMolecules])

  const filtered = molecules.filter(m =>
    `${m.nom} ${m.code} ${m.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!form.code || !form.nom) {
      Swal.fire({ icon: 'warning', title: t('error'), text: t('requiredFields'), ...SWL }); return
    }
    setSub(true)
    try {
      await api.post('/molecules', { ...form, nombre_dose_standard: Number(form.nombre_dose_standard) })
      Swal.fire({ icon: 'success', title: t('moleculeCreated'), timer: 1500, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      setForm({ ...EMPTY }); setCreateOpen(false); fetchMolecules()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('createError'), ...SWL })
    } finally { setSub(false) }
  }

  const openEdit = (m: Molecule) => {
    setEditM(m)
    setEditForm({ code: m.code, nom: m.nom, description: m.description ?? '', nombre_dose_standard: m.nombre_dose_standard })
  }

  const handleUpdate = async () => {
    if (!editM) return
    setEditSub(true)
    try {
      await api.put(`/molecules/${editM.id_molecule}`, { ...editForm, nombre_dose_standard: Number(editForm.nombre_dose_standard) })
      Swal.fire({ icon: 'success', title: t('moleculeUpdated'), timer: 1500, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      setEditM(null); fetchMolecules()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('updateError'), ...SWL })
    } finally { setEditSub(false) }
  }

  const handleDelete = async (m: Molecule) => {
    const res = await Swal.fire({
      title: t('deleteConfirmTitle', {name: m.nom}), text: t('deleteConfirmText'),
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#EF4444', cancelButtonColor: '#334155',
      confirmButtonText: t('deleteBtn'), cancelButtonText: t('cancelBtn'), ...SWL,
    })
    if (!res.isConfirmed) return
    try {
      await api.delete(`/molecules/${m.id_molecule}`)
      Swal.fire({ icon: 'success', title: t('moleculeDeleted'), timer: 1200, showConfirmButton: false, ...SWL, iconColor: '#10B981' })
      fetchMolecules()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('deleteError'), ...SWL })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/60 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchMolecules} className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" /> {t('newMolecule')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-white/20 bg-card">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10"><FlaskConical className="h-5 w-5 text-sky-400" /></div>
            <div><div className="text-2xl font-bold text-sky-400">{molecules.length}</div><div className="text-xs text-white/50">{t('totalMolecules')}</div></div>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-card">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10"><FlaskConical className="h-5 w-5 text-emerald-400" /></div>
            <div><div className="text-2xl font-bold text-emerald-400">{molecules.filter(m => m.nombre_dose_standard === 1).length}</div><div className="text-xs text-white/50">{t('singleDose')}</div></div>
          </CardContent>
        </Card>
        <Card className="border-white/20 bg-card">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-violet-500/10"><FlaskConical className="h-5 w-5 text-violet-400" /></div>
            <div><div className="text-2xl font-bold text-violet-400">{molecules.filter(m => m.nombre_dose_standard > 1).length}</div><div className="text-xs text-white/50">{t('multiDose')}</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input placeholder={t('searchPlaceholder')}
          value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-muted border-white/20 text-white placeholder:text-white/30" />
      </div>

      {/* Table */}
      <Card className="border-white/20 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-white/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /><span>{t('loading')}</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 bg-white/5 hover:bg-white/5">
                  <TableHead className="text-white font-medium">{t('columnName')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnCode')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnDescription')}</TableHead>
                  <TableHead className="text-white font-medium">{t('columnDoses')}</TableHead>
                  <TableHead className="text-white font-medium text-center w-[120px]">{t('columnActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id_molecule} className="border-white/20 hover:bg-white/5">
                    <TableCell className="text-white font-medium">{m.nom}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/10">{m.code}</span>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm max-w-[300px]">
                      <span className="line-clamp-2">{m.description ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', m.nombre_dose_standard === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-violet-500/10 text-violet-400 border-violet-500/30')}>
                        {m.nombre_dose_standard} dose{m.nombre_dose_standard > 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" title="Modifier" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300" title="Supprimer" onClick={() => handleDelete(m)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
              <FlaskConical className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t('noMolecules')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <p className="text-xs text-white/30 text-right">
          {filtered.length} molécule{filtered.length > 1 ? 's' : ''}
          {filtered.length !== molecules.length && ` sur ${molecules.length}`}
        </p>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border-white/20 text-white">
          <DialogHeader><DialogTitle className="text-white">{t('createTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white">{t('codeLabel')} <span className="text-red-400">*</span></Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="VPO" className="bg-muted border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('nameLabel')} <span className="text-red-400">*</span></Label>
              <Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Vaccin Polio Oral" className="bg-muted border-white/20 text-white placeholder:text-white/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('descriptionLabel')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="bg-muted border-white/20 text-white resize-none placeholder:text-white/30" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('dosesLabel')}</Label>
              <Input type="number" min={1} value={form.nombre_dose_standard} onChange={e => setForm(f => ({ ...f, nombre_dose_standard: parseInt(e.target.value) || 1 }))} className="bg-muted border-white/20 text-white w-28" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-primary hover:bg-primary/90 text-white">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('creating')}</> : t('createBtn')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editM} onOpenChange={() => setEditM(null)}>
        <DialogContent className="sm:max-w-[420px] bg-card border-white/20 text-white">
          <DialogHeader><DialogTitle className="text-white">{t('editTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white">{t('codeLabel')} <span className="text-red-400">*</span></Label>
              <Input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} className="bg-muted border-white/20 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('nameLabel')} <span className="text-red-400">*</span></Label>
              <Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} className="bg-muted border-white/20 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('descriptionLabel')}</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="bg-muted border-white/20 text-white resize-none" />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('dosesLabel')}</Label>
              <Input type="number" min={1} value={editForm.nombre_dose_standard} onChange={e => setEditForm(f => ({ ...f, nombre_dose_standard: parseInt(e.target.value) || 1 }))} className="bg-muted border-white/20 text-white w-28" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setEditM(null)}>{t('cancel')}</Button>
              <Button onClick={handleUpdate} disabled={editSub} className="bg-primary hover:bg-primary/90 text-white">
                {editSub ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('saving')}</> : t('saveBtn')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
