'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Swal from 'sweetalert2'
import api from '@/lib/api'
import { useTranslations } from 'next-intl'

interface Target {
  id_target: number
  first_name_target: string | null
  last_name_target: string | null
  age: number | null
  sex: string | null
  chw_id: number | null
  vaccinate: boolean
  id_campain: number | null
  beneficiaire: boolean
}

interface Campaign {
  id_campaign: number
  nom: string
}

const SWL = { background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' }

export default function TargetsPage() {
  const t = useTranslations('Targets')
  
  const [targets, setTargets] = useState<Target[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Dialogs state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const defaultForm = {
    first_name_target: '',
    last_name_target: '',
    age: '',
    sex: 'M',
    chw_id: '',
    id_campain: '',
    vaccinate: false,
    beneficiaire: false
  }
  
  const [form, setForm] = useState(defaultForm)
  const [currentId, setCurrentId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [targetsRes, campaignsRes] = await Promise.all([
        api.get('/targets?limit=500'),
        api.get('/campaigns?page_size=100')
      ])
      setTargets(targetsRes.data.items || [])
      setCampaigns(campaignsRes.data.items || [])
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: t('error'), text: t('loadError'), ...SWL })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenCreate = () => {
    setForm(defaultForm)
    setIsEditing(false)
    setCurrentId(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (t: Target) => {
    setForm({
      first_name_target: t.first_name_target || '',
      last_name_target: t.last_name_target || '',
      age: t.age ? String(t.age) : '',
      sex: t.sex || 'M',
      chw_id: t.chw_id ? String(t.chw_id) : '',
      id_campain: t.id_campain ? String(t.id_campain) : '',
      vaccinate: t.vaccinate || false,
      beneficiaire: t.beneficiaire || false
    })
    setIsEditing(true)
    setCurrentId(t.id_target)
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        first_name_target: form.first_name_target || null,
        last_name_target: form.last_name_target || null,
        age: form.age ? parseInt(form.age) : null,
        sex: form.sex || null,
        chw_id: form.chw_id ? parseInt(form.chw_id) : null,
        id_campain: form.id_campain ? parseInt(form.id_campain) : null,
        vaccinate: form.vaccinate,
        beneficiaire: form.beneficiaire
      }

      if (isEditing && currentId) {
        await api.put(`/targets/${currentId}`, payload)
        Swal.fire({ icon: 'success', title: t('updateSuccess'), timer: 1500, showConfirmButton: false, ...SWL })
      } else {
        await api.post('/targets', payload)
        Swal.fire({ icon: 'success', title: t('createSuccess'), timer: 1500, showConfirmButton: false, ...SWL })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err: any) {
      console.error(err)
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('defaultError'), ...SWL })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const r = await Swal.fire({
      title: t('deleteConfirmTitle'),
      text: t('deleteConfirmText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#334155',
      confirmButtonText: t('deleteBtn'),
      cancelButtonText: t('cancelBtn'),
      ...SWL
    })

    if (r.isConfirmed) {
      try {
        await api.delete(`/targets/${id}`)
        Swal.fire({ icon: 'success', title: t('deletedTitle'), timer: 1500, showConfirmButton: false, ...SWL })
        fetchData()
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: t('error'), text: t('deleteError'), ...SWL })
      }
    }
  }

  const filteredTargets = targets.filter(t => 
    (t.first_name_target?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (t.last_name_target?.toLowerCase() || '').includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('pageTitle')}</h2>
          <p className="text-white/60 text-sm mt-1">{t('pageDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" /> {t('newTarget')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 bg-muted border-white/20 text-white placeholder:text-white/30" 
          />
        </div>
      </div>

      {/* Table */}
      <Card className="border-white/20 overflow-hidden bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-white/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>{t('loading')}</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/20 bg-white/5 hover:bg-white/5">
                  <TableHead className="text-white font-medium">{t('colLastName')}</TableHead>
                  <TableHead className="text-white font-medium">{t('colFirstName')}</TableHead>
                  <TableHead className="text-white font-medium">{t('colAge')}</TableHead>
                  <TableHead className="text-white font-medium">{t('colSex')}</TableHead>
                  <TableHead className="text-white font-medium text-center">{t('colVaccinated')}</TableHead>
                  <TableHead className="text-white font-medium text-center">{t('colBeneficiary')}</TableHead>
                  <TableHead className="text-white font-medium text-center w-[100px]">{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTargets.map(tData => (
                  <TableRow key={tData.id_target} className="border-white/20 hover:bg-white/5">
                    <TableCell className="text-white">{tData.last_name_target || '-'}</TableCell>
                    <TableCell className="text-white">{tData.first_name_target || '-'}</TableCell>
                    <TableCell className="text-white">{tData.age ?? '-'}</TableCell>
                    <TableCell className="text-white">{tData.sex === 'M' ? t('sexMale') : tData.sex === 'F' ? t('sexFemale') : '-'}</TableCell>
                    <TableCell className="text-center">
                      {tData.vaccinate ? <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" /> : <XCircle className="h-5 w-5 text-red-400 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {tData.beneficiaire ? <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" /> : <XCircle className="h-5 w-5 text-red-400 mx-auto" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300" onClick={() => handleOpenEdit(tData)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleDelete(tData.id_target)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filteredTargets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-white/30 gap-3">
              <p className="text-sm">{t('emptyData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{isEditing ? t('editTarget') : t('newTarget')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-white">{t('colLastName')}</Label>
                <Input 
                  value={form.last_name_target} 
                  onChange={e => setForm({...form, last_name_target: e.target.value})} 
                  className="bg-muted border-white/20 text-white" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white">{t('colFirstName')}</Label>
                <Input 
                  value={form.first_name_target} 
                  onChange={e => setForm({...form, first_name_target: e.target.value})} 
                  className="bg-muted border-white/20 text-white" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-white">{t('colAge')}</Label>
                <Input 
                  type="number"
                  value={form.age} 
                  onChange={e => setForm({...form, age: e.target.value})} 
                  className="bg-muted border-white/20 text-white" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white">{t('colSex')}</Label>
                <Select value={form.sex} onValueChange={v => setForm({...form, sex: v})}>
                  <SelectTrigger className="bg-muted border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    <SelectItem value="M">{t('sexMale')}</SelectItem>
                    <SelectItem value="F">{t('sexFemale')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-white">{t('campaignLabel')}</Label>
                <Select value={form.id_campain} onValueChange={v => setForm({...form, id_campain: v})}>
                  <SelectTrigger className="bg-muted border-white/20 text-white">
                    <SelectValue placeholder={t('selectCampaign')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/20">
                    {campaigns.map(c => (
                      <SelectItem key={c.id_campaign} value={String(c.id_campaign)}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-white">{t('agentLabel')}</Label>
                <Input 
                  type="number"
                  value={form.chw_id} 
                  onChange={e => setForm({...form, chw_id: e.target.value})} 
                  className="bg-muted border-white/20 text-white" 
                  placeholder={t('agentPlaceholder')}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="vaccinate" 
                  checked={form.vaccinate} 
                  onCheckedChange={(c) => setForm({...form, vaccinate: c as boolean})}
                  className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="vaccinate" className="text-white cursor-pointer">{t('colVaccinated')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="beneficiaire" 
                  checked={form.beneficiaire} 
                  onCheckedChange={(c) => setForm({...form, beneficiaire: c as boolean})}
                  className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="beneficiaire" className="text-white cursor-pointer">{t('colBeneficiary')}</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setIsDialogOpen(false)}>{t('cancelBtn')}</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t('saveBtn')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
