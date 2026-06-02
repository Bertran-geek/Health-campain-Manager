'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  GraduationCap,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockAgents, mockTeams, mockHealthAreas, mockCampaigns } from '@/lib/mock-data'
import type { Agent, Team } from '@/lib/types'

const agentTypeColors: Record<Agent['agentType'], string> = {
  vaccinator: 'bg-primary/20 text-primary',
  recorder: 'bg-info/20 text-info',
  mobilizer: 'bg-accent/20 text-accent',
  supervisor: 'bg-warning/20 text-warning',
  team_leader: 'bg-success/20 text-success',
}

const agentStats = [
  { label: 'Total Agents', value: mockAgents.length, icon: Users, color: 'text-foreground' },
  { label: 'Active', value: mockAgents.filter(a => a.isActive).length, icon: UserCheck, color: 'text-success' },
  { label: 'Trained', value: mockAgents.filter(a => a.isTrained).length, icon: GraduationCap, color: 'text-primary' },
  { label: 'Teams', value: mockTeams.length, icon: Users, color: 'text-info' },
]

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('agents')

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = 
      `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery)
    const matchesType = typeFilter === 'all' || agent.agentType === typeFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && agent.isActive) ||
      (statusFilter === 'inactive' && !agent.isActive) ||
      (statusFilter === 'trained' && agent.isTrained) ||
      (statusFilter === 'untrained' && !agent.isTrained)
    return matchesSearch && matchesType && matchesStatus
  })

  const getHealthAreaName = (healthAreaId: string) => {
    return mockHealthAreas.find(ha => ha.id === healthAreaId)?.name || 'Unknown'
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agent Management</h2>
          <p className="text-muted-foreground">
            Manage field agents and team assignments
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>
                Register a new field agent for campaign activities.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter first name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+243 XXX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" type="email" placeholder="agent@health.org" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentType">Agent Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccinator">Vaccinator</SelectItem>
                      <SelectItem value="recorder">Recorder</SelectItem>
                      <SelectItem value="mobilizer">Mobilizer</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="team_leader">Team Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthArea">Health Area</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockHealthAreas.map(ha => (
                        <SelectItem key={ha.id} value={ha.id}>
                          {ha.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90">Add Agent</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {agentStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 pt-4">
                <div className={cn('p-2 rounded-lg bg-muted')}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-transparent focus:border-primary"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vaccinator">Vaccinator</SelectItem>
                <SelectItem value="recorder">Recorder</SelectItem>
                <SelectItem value="mobilizer">Mobilizer</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="team_leader">Team Leader</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="trained">Trained</SelectItem>
                <SelectItem value="untrained">Not Trained</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agents Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Agent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Health Area</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {getInitials(agent.firstName, agent.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {agent.firstName} {agent.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {agent.id.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', agentTypeColors[agent.agentType])}>
                          {agent.agentType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {getHealthAreaName(agent.healthAreaId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{agent.phone}</span>
                          </div>
                          {agent.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{agent.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs w-fit',
                              agent.isActive 
                                ? 'bg-success/10 text-success border-success/30' 
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs w-fit',
                              agent.isTrained 
                                ? 'bg-primary/10 text-primary border-primary/30' 
                                : 'bg-warning/10 text-warning border-warning/30'
                            )}
                          >
                            {agent.isTrained ? 'Trained' : 'Not Trained'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <GraduationCap className="mr-2 h-4 w-4" />
                              Mark as Trained
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {agent.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredAgents.length === 0 && (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No agents found matching your criteria</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTeams.map((team) => {
              const teamLeader = mockAgents.find(a => a.id === team.teamLeaderId)
              const healthArea = mockHealthAreas.find(ha => ha.id === team.healthAreaId)
              const campaign = mockCampaigns.find(c => c.id === team.campaignId)
              
              return (
                <Card key={team.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {team.code}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Campaign:</span>
                        <span className="text-foreground font-medium">{campaign?.name.split(' - ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{healthArea?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">Daily Target: {team.dailyTarget}</span>
                      </div>
                    </div>
                    
                    {teamLeader && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-success/20 text-success text-xs">
                            {getInitials(teamLeader.firstName, teamLeader.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {teamLeader.firstName} {teamLeader.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">Team Leader</div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Team
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Add Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Add Team Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <Plus className="h-10 w-10 mb-2" />
                <span>Create New Team</span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
