'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Phone, Mail, MapPin, MoreVertical,
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
import Swal from 'sweetalert2'

interface Role { id_role: number; code: string; nom: string }
interface Scope { niveau: string; id_region?: number | null }
interface Agent {
  id_user: number; username: string; nom: string; prenom?: string
  email?: string; telephone?: string; actif: boolean
  roles: Role[]; scopes: Scope[]; created_at: string
}

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

export default function AgentsPage() {
  const [agents, setAgents]       = useState<Agent[]>([])
  const [roles, setRoles]         = useState<Role[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [dialogOpen, setDialog]   = useState(false)
  const [submitting, setSub]      = useState(false)
  const [form, setForm]           = useState({ ...EMPTY_FORM })

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setAgents(res.data.items ?? [])
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les agents.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setLoading(false) }
  }, [])

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get('/users/roles')
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
      Swal.fire({ icon: 'warning', title: 'Champs requis',
        text: 'Nom, identifiant, rôle et mot de passe sont obligatoires.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
      return
    }
    setSub(true)
    try {
      await api.post('/users', {
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
      Swal.fire({ icon: 'success', title: 'Agent créé !', timer: 1500,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      setForm({ ...EMPTY_FORM })
      setDialog(false)
      fetchAgents()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erreur',
        text: err.response?.data?.detail || 'Échec de la création.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    } finally { setSub(false) }
  }

  const handleToggle = async (agent: Agent) => {
    try {
      await api.put(`/users/${agent.id_user}`, { actif: !agent.actif })
      fetchAgents()
    } catch {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Modification impossible.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    }
  }

  const handleDelete = async (agent: Agent) => {
    const res = await Swal.fire({
      title: `Supprimer ${agent.nom} ${agent.prenom ?? ''} ?`,
      text: 'Cette action est irréversible.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#EF4444', cancelButtonColor: '#334155',
      confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler',
      background: '#0D1B2E', color: '#E2EAF2',
    })
    if (!res.isConfirmed) return
    try {
      await api.delete(`/users/${agent.id_user}`)
      Swal.fire({ icon: 'success', title: 'Supprimé !', timer: 1200,
        showConfirmButton: false, background: '#0D1B2E', color: '#E2EAF2', iconColor: '#10B981' })
      fetchAgents()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Erreur',
        text: err.response?.data?.detail || 'Suppression impossible.',
        background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' })
    }
  }

  const getInitials = (nom: string, prenom?: string) =>
    `${nom[0]}${prenom ? prenom[0] : ''}`.toUpperCase()

  const stats = [
    { label: 'Total', value: agents.length, icon: Users,     color: 'text-sky-400',    bg: 'bg-sky-500/10' },
    { label: 'Actifs', value: agents.filter(a => a.actif).length, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Inactifs', value: agents.filter(a => !a.actif).length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Rôles', value: roles.length, icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Agents</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Créez, gérez et suivez les agents de terrain
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchAgents} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> Nouvel Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Créer un Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nom <span className="text-red-400">*</span></Label>
                    <Input placeholder="Dupont" value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label>Prénom</Label>
                    <Input placeholder="Jean" value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Identifiant (username) <span className="text-red-400">*</span></Label>
                  <Input placeholder="jean.dupont" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" placeholder="jean@health.local" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                  <div className="space-y-1">
                    <Label>Téléphone</Label>
                    <Input placeholder="+22600000001" value={form.telephone}
                      onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                      className="bg-muted border-border" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Mot de passe <span className="text-red-400">*</span> <span className="text-xs text-muted-foreground">(min 8 caractères)</span></Label>
                  <Input type="password" placeholder="••••••••" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-muted border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Rôle <span className="text-red-400">*</span></Label>
                    <Select value={form.role_id} onValueChange={v => setForm(f => ({ ...f, role_id: v }))}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {roles.map(r => (
                          <SelectItem key={r.id_role} value={String(r.id_role)}>{r.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Zone géographique <span className="text-red-400">*</span></Label>
                    <Select value={form.niveau} onValueChange={v => setForm(f => ({ ...f, niveau: v }))}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {NIVEAUX.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialog(false)}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : 'Créer l\'agent'}
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
          <Input placeholder="Rechercher par nom, identifiant, email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border focus:border-primary" />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-muted border-border">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Chargement des agents...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-muted-foreground font-medium">Agent</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Contact</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Rôles</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Zone</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Statut</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(agent => (
                  <TableRow key={agent.id_user} className="border-border hover:bg-muted/20">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {getInitials(agent.nom, agent.prenom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {agent.nom} {agent.prenom ?? ''}
                          </p>
                          <p className="text-xs text-muted-foreground">@{agent.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {agent.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />{agent.email}
                          </div>
                        )}
                        {agent.telephone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{agent.telephone}
                          </div>
                        )}
                        {!agent.email && !agent.telephone && (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {agent.roles.length === 0
                          ? <span className="text-xs text-muted-foreground/50">Aucun</span>
                          : agent.roles.map(r => (
                            <Badge key={r.id_role} variant="outline"
                              className={cn('text-xs px-1.5', ROLE_COLORS[r.code] ?? 'bg-muted text-foreground')}>
                              {r.code.replace('_', ' ')}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {agent.scopes.length === 0
                          ? <span className="text-xs text-muted-foreground/50">—</span>
                          : agent.scopes.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 text-primary/60" />{s.niveau}
                            </div>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs',
                        agent.actif
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      )}>
                        {agent.actif ? 'Actif' : 'Inactif'}
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
                          <DropdownMenuItem onClick={() => handleToggle(agent)}
                            className="cursor-pointer">
                            {agent.actif
                              ? <><UserX className="mr-2 h-4 w-4 text-amber-400" />Désactiver</>
                              : <><UserCheck className="mr-2 h-4 w-4 text-emerald-400" />Activer</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem onClick={() => handleDelete(agent)}
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
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">Aucun agent trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer count */}
      {!loading && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} agent{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          {filtered.length !== agents.length && ` sur ${agents.length}`}
        </p>
      )}
    </div>
  )
}
