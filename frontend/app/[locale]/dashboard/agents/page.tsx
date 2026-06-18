'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Phone, Mail, MapPin, MoreVertical, Edit,
  Trash2, UserCheck, UserX, Users, Loader2, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { userService } from '@/lib/services'
import type { Agent, Role } from '@/lib/services'
import Swal from 'sweetalert2'
import { useTranslations } from 'next-intl'

interface Scope { niveau: string; id_region?: number | null }

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:       'bg-purple-500/15 text-purple-300 border-purple-500/30',
  NATIONAL_MANAGER:  'bg-sky-500/15 text-sky-300 border-sky-500/30',
  REGION_MANAGER:    'bg-teal-500/15 text-teal-300 border-teal-500/30',
  DPT_MANAGER:       'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PHC_MANAGER:       'bg-orange-500/15 text-orange-300 border-orange-500/30',
  CHW:               'bg-green-500/15 text-green-300 border-green-500/30',
}

const NIVEAUX = ['NATIONAL', 'REGION', 'DEPARTEMENT', 'PHC', 'CHW']

const EMPTY_FORM = {
  nom: '', prenom: '', username: '', email: '', telephone: '',
  password: '', role_id: '', niveau: 'NATIONAL',
}

export default function UsersPage() {
  const [agents, setAgents]       = useState<Agent[]>([])
  const [roles, setRoles]         = useState<Role[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const t = useTranslations('Agents')
  const [statusFilter, setStatus] = useState('all')
  
  const [dialogOpen, setDialog]   = useState(false)
  const [editDialogOpen, setEditDialog] = useState(false)
  const [editingUser, setEditingUser]   = useState<Agent | null>(null)
  
  const [submitting, setSub]      = useState(false)
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [editForm, setEditForm]   = useState({ ...EMPTY_FORM })

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userService.list()
      setAgents(res.data.items ?? [])
    } catch {
      Swal.fire({ icon: 'error', title: t('error'), text: t('loadError'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setLoading(false) }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await userService.listRoles()
      setRoles(res.data ?? [])
    } catch { /* silently ignore */ }
  }, [])

  useEffect(() => { fetchAgents(); fetchRoles() }, [fetchAgents, fetchRoles])

  const filtered = agents.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = `${a.nom} ${a.prenom ?? ''} ${a.username} ${a.email ?? ''}`.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active' && a.actif)
      || (statusFilter === 'inactive' && !a.actif)
    return matchSearch && matchStatus
  })

  const handleCreate = async () => {
    if (!form.nom || !form.username || !form.password || !form.role_id) {
      Swal.fire({ icon: 'warning', title: t('error'),
        text: t('requiredFields'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
      return
    }
    setSub(true)
    try {
      await userService.create({
        username:  form.username,
        nom:       form.nom,
        prenom:    form.prenom || undefined,
        email:     form.email  || undefined,
        telephone: form.telephone || undefined,
        password:  form.password,
        actif:     true,
        role_ids:  [parseInt(form.role_id)],
        scopes:    [{ niveau: form.niveau, actif: true }],
      })
      Swal.fire({ icon: 'success', title: t('userCreated'), timer: 1500,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      setForm({ ...EMPTY_FORM })
      setDialog(false)
      fetchAgents()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'),
        text: err.response?.data?.detail || t('createError'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setSub(false) }
  }

  const openEdit = (user: Agent) => {
    setEditingUser(user)
    setEditForm({
      nom: user.nom,
      prenom: user.prenom || '',
      username: user.username,
      email: user.email || '',
      telephone: user.telephone || '',
      password: '', // blank unless changing
      role_id: user.roles[0]?.id_role.toString() || '',
      niveau: user.scopes[0]?.niveau || 'NATIONAL',
    })
    setEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingUser || !editForm.nom || !editForm.role_id) {
      Swal.fire({ icon: 'warning', title: t('error'),
        text: t('requiredFieldsUpdate'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
      return
    }
    setSub(true)
    try {
      const payload: any = {
        nom: editForm.nom,
        prenom: editForm.prenom || null,
        email: editForm.email || null,
        telephone: editForm.telephone || null,
        role_ids: [parseInt(editForm.role_id)],
        scopes: [{ niveau: editForm.niveau, actif: true }],
      }
      if (editForm.password) payload.password = editForm.password

      await userService.update(editingUser.id_user, payload)
      Swal.fire({ icon: 'success', title: t('userUpdated'), timer: 1500,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      setEditDialog(false)
      fetchAgents()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'),
        text: err.response?.data?.detail || t('updateError'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setSub(false) }
  }

  const handleToggle = async (agent: Agent) => {
    try {
      await userService.toggleActive(agent)
      fetchAgents()
    } catch {
      Swal.fire({ icon: 'error', title: t('error'), text: t('modifyError'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    }
  }

  const handleDelete = async (agent: Agent) => {
    const res = await Swal.fire({
      title: t('deleteConfirmTitle', {name: `${agent.nom} ${agent.prenom ?? ''}`.trim()}),
      text: t('deleteConfirmText'),
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#EF4444', cancelButtonColor: '#334155',
      confirmButtonText: t('deleteBtn'), cancelButtonText: t('cancelBtn'),
      background: '#0D1B2E', color: '#E2EAF2',
    })
    if (!res.isConfirmed) return
    try {
      await userService.delete(agent.id_user)
      Swal.fire({ icon: 'success', title: t('deleted'), timer: 1200,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      fetchAgents()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'),
        text: err.response?.data?.detail || t('deleteError'),
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    }
  }

  const getInitials = (nom: string, prenom?: string) =>
    `${nom[0]}${prenom ? prenom[0] : ''}`.toUpperCase()

  const stats = [
    { label: t('total'), value: agents.length, icon: Users,     color: 'text-sky-400',    bg: 'bg-sky-500/10' },
    { label: t('active'), value: agents.filter(a => a.actif).length, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: t('inactive'), value: agents.filter(a => !a.actif).length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: t('roles'), value: roles.length, icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/70 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchAgents} title="Rafraîchir" className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> {t('newUser')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-card border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">{t('createUserTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 text-white">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Nom <span className="text-red-400">*</span></Label>
                    <Input placeholder="Dupont" value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Prénom</Label>
                    <Input placeholder="Jean" value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-white">Identifiant (username) <span className="text-red-400">*</span></Label>
                  <Input placeholder="jean.dupont" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Email</Label>
                    <Input type="email" placeholder="jean@health.local" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Téléphone</Label>
                    <Input placeholder="+22600000001" value={form.telephone}
                      onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-white">Mot de passe <span className="text-red-400">*</span> <span className="text-xs text-white/50">(min 8 caractères)</span></Label>
                  <Input type="password" placeholder="••••••••" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Rôle <span className="text-red-400">*</span></Label>
                    <Select value={form.role_id} onValueChange={v => setForm(f => ({ ...f, role_id: v }))}>
                      <SelectTrigger className="bg-muted border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/20 text-white">
                        {roles.map(r => (
                          <SelectItem key={r.id_role} value={String(r.id_role)}>{r.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Zone géographique <span className="text-red-400">*</span></Label>
                    <Select value={form.niveau} onValueChange={v => setForm(f => ({ ...f, niveau: v }))}>
                      <SelectTrigger className="bg-muted border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/20 text-white">
                        {NIVEAUX.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialog(false)} className="border-white/20 text-white">{t('cancel')}</Button>
                  <Button onClick={handleCreate} disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('creating')}</> : t('createBtn')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Modal */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialog}>
            <DialogContent className="sm:max-w-[540px] bg-card border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">{t('editUserTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2 text-white">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Nom <span className="text-red-400">*</span></Label>
                    <Input placeholder="Dupont" value={editForm.nom}
                      onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Prénom</Label>
                    <Input placeholder="Jean" value={editForm.prenom}
                      onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-white">Identifiant (Lecture seule)</Label>
                  <Input value={editForm.username} disabled
                    className="bg-muted/50 border-white/10 text-white/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Email</Label>
                    <Input type="email" placeholder="jean@health.local" value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Téléphone</Label>
                    <Input placeholder="+22600000001" value={editForm.telephone}
                      onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                      className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-white">Nouveau mot de passe <span className="text-xs text-white/50">(Laisser vide pour ne pas modifier)</span></Label>
                  <Input type="password" placeholder="••••••••" value={editForm.password}
                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-muted border-white/20 text-white placeholder:text-white/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white">Rôle <span className="text-red-400">*</span></Label>
                    <Select value={editForm.role_id} onValueChange={v => setEditForm(f => ({ ...f, role_id: v }))}>
                      <SelectTrigger className="bg-muted border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/20 text-white">
                        {roles.map(r => (
                          <SelectItem key={r.id_role} value={String(r.id_role)}>{r.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white">Zone géographique <span className="text-red-400">*</span></Label>
                    <Select value={editForm.niveau} onValueChange={v => setEditForm(f => ({ ...f, niveau: v }))}>
                      <SelectTrigger className="bg-muted border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/20 text-white">
                        {NIVEAUX.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditDialog(false)} className="border-white/20 text-white">{t('cancel')}</Button>
                  <Button onClick={handleUpdate} disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('updating')}</> : t('updateBtn')}
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
            <Card key={i} className="border-white/20 bg-card/50">
              <CardContent className="flex items-center gap-3 pt-4 pb-4">
                <div className={cn('p-2.5 rounded-xl', s.bg)}>
                  <Icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <div className={cn('text-2xl font-bold text-white')}>{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input placeholder={t('searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-white/20 text-white placeholder:text-white/40 focus:border-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-card border-white/20 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/20 text-white">
            <SelectItem value="all">{t('statusAll')}</SelectItem>
            <SelectItem value="active">{t('statusActive')}</SelectItem>
            <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-white/20 bg-card overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>{t('loading')}</span>
            </div>
          ) : (
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-white/20 bg-white/5 hover:bg-white/5">
                  <TableHead className="text-white font-semibold">{t('columnUser')}</TableHead>
                  <TableHead className="text-white font-semibold">Contact</TableHead>
                  <TableHead className="text-white font-semibold">{t('roles')}</TableHead>
                  <TableHead className="text-white font-semibold">Zone</TableHead>
                  <TableHead className="text-white font-semibold">Statut</TableHead>
                  <TableHead className="w-[50px] border-white/20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(agent => (
                  <TableRow key={agent.id_user} className="border-white/20 hover:bg-white/5">
                    <TableCell className="border-white/20 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                            {getInitials(agent.nom, agent.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {agent.nom} {agent.prenom ?? ''}
                          </p>
                          <p className="text-xs text-white/60">@{agent.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-white/20 border-b text-white/80">
                      <div className="space-y-0.5">
                        {agent.email && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="h-3 w-3" />{agent.email}
                          </div>
                        )}
                        {agent.telephone && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Phone className="h-3 w-3" />{agent.telephone}
                          </div>
                        )}
                        {!agent.email && !agent.telephone && (
                          <span className="text-xs opacity-50">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="border-white/20 border-b">
                      <div className="flex flex-wrap gap-1">
                        {agent.roles.length === 0
                          ? <span className="text-xs text-white/50">{t('noRole')}</span>
                          : agent.roles.map(r => (
                            <Badge key={r.id_role} variant="outline"
                              className={cn('text-xs px-1.5', ROLE_COLORS[r.code] ?? 'bg-white/10 text-white')}>
                              {r.code.replace('_', ' ')}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="border-white/20 border-b">
                      <div className="flex flex-wrap gap-1">
                        {agent.scopes.length === 0
                          ? <span className="text-xs text-white/50">—</span>
                          : agent.scopes.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-white/80">
                              <MapPin className="h-3 w-3 text-primary" />{s.niveau}
                            </div>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="border-white/20 border-b">
                      <Badge variant="outline" className={cn('text-xs',
                        agent.actif
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-red-500/20 text-red-300 border-red-500/50'
                      )}>
                        {agent.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-white/20 border-b text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10 text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-white/20 text-white">
                          <DropdownMenuItem onClick={() => openEdit(agent)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                            <Edit className="mr-2 h-4 w-4 text-sky-400" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(agent)}
                            className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                            {agent.actif
                              ? <><UserX className="mr-2 h-4 w-4 text-amber-400" />Désactiver</>
                              : <><UserCheck className="mr-2 h-4 w-4 text-emerald-400" />Activer</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/20" />
                          <DropdownMenuItem onClick={() => handleDelete(agent)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
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
            <div className="flex flex-col items-center justify-center h-48 text-white/50 gap-3">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t('noUsersFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer count */}
      {!loading && (
        <p className="text-xs text-white/60 text-right">
          {filtered.length} {filtered.length > 1 ? t('columnUser').toLowerCase() + 's' : t('columnUser').toLowerCase()} affiché{filtered.length > 1 ? 's' : ''}
          {filtered.length !== agents.length && ` sur ${agents.length}`}
        </p>
      )}
    </div>
  )
}
