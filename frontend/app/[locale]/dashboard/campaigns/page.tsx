'use client'

import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Target,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockCampaigns, mockCountries, getCampaignTypeLabel, getStatusColor } from '@/lib/mock-data'
import type { Campaign } from '@/lib/types'

const campaignStats = [
  { label: 'Total Campaigns', value: mockCampaigns.length, color: 'text-foreground' },
  { label: 'Active', value: mockCampaigns.filter(c => c.status === 'in_progress').length, color: 'text-success' },
  { label: 'Approved', value: mockCampaigns.filter(c => c.status === 'approved').length, color: 'text-info' },
  { label: 'Draft', value: mockCampaigns.filter(c => c.status === 'draft').length, color: 'text-muted-foreground' },
]

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.campaignType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaign Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and monitor health campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new health campaign with target populations and schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" placeholder="e.g., Polio Round 4 - Kinshasa 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the campaign objectives..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccination_polio">Polio Vaccination</SelectItem>
                      <SelectItem value="vaccination_measles">Measles Vaccination</SelectItem>
                      <SelectItem value="vaccination_covid">COVID-19 Vaccination</SelectItem>
                      <SelectItem value="mosquito_net">Mosquito Net Distribution</SelectItem>
                      <SelectItem value="vitamin_a">Vitamin A Supplementation</SelectItem>
                      <SelectItem value="deworming">Deworming</SelectItem>
                      <SelectItem value="combined">Combined Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCountries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetPopulation">Target Population</Label>
                  <Input id="targetPopulation" type="number" placeholder="e.g., 2500000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <Input id="budget" type="number" placeholder="e.g., 500000" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {campaignStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-transparent focus:border-primary"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Campaign Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="vaccination_polio">Polio</SelectItem>
            <SelectItem value="vaccination_measles">Measles</SelectItem>
            <SelectItem value="vaccination_covid">COVID-19</SelectItem>
            <SelectItem value="mosquito_net">Mosquito Net</SelectItem>
            <SelectItem value="vitamin_a">Vitamin A</SelectItem>
            <SelectItem value="deworming">Deworming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const progress = campaign.status === 'in_progress' ? 66.6 : 
                                 campaign.status === 'completed' ? 100 : 0
                const daysRemaining = getDaysRemaining(campaign.endDate)
                
                return (
                  <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {campaign.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCampaignTypeLabel(campaign.campaignType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', getStatusColor(campaign.status))}>
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-foreground">{formatDate(campaign.startDate)}</div>
                        <div className="text-muted-foreground">
                          {campaign.status === 'in_progress' && daysRemaining > 0 
                            ? `${daysRemaining} days left`
                            : `to ${formatDate(campaign.endDate)}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-foreground font-medium">
                          {(campaign.targetPopulation / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-muted-foreground">
                          ${(campaign.budgetAllocated / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.status === 'in_progress' || campaign.status === 'completed' ? (
                        <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Coverage</span>
                            <span className="text-foreground font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
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
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Campaign
                          </DropdownMenuItem>
                          {campaign.status === 'approved' && (
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Start Campaign
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'in_progress' && (
                            <>
                              <DropdownMenuItem>
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredCampaigns.length === 0 && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns found matching your criteria</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
