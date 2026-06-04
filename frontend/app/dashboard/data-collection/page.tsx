'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Download,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockDailyReports, mockAgents, mockVillages, mockTeams, mockCampaigns } from '@/lib/mock-data'
import type { DailyReport } from '@/lib/types'

const reportStatusColors: Record<DailyReport['status'], string> = {
  submitted: 'bg-info/20 text-info border-info/30',
  verified: 'bg-success/20 text-success border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
  requires_correction: 'bg-warning/20 text-warning border-warning/30',
}

const reportStatusIcons: Record<DailyReport['status'], React.ReactNode> = {
  submitted: <Clock className="h-4 w-4" />,
  verified: <CheckCircle className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  requires_correction: <AlertCircle className="h-4 w-4" />,
}

const reportStats = [
  { label: 'Total Reports', value: mockDailyReports.length, color: 'text-foreground' },
  { label: 'Verified', value: mockDailyReports.filter(r => r.status === 'verified').length, color: 'text-success' },
  { label: 'Pending', value: mockDailyReports.filter(r => r.status === 'submitted').length, color: 'text-info' },
  { label: 'Needs Review', value: mockDailyReports.filter(r => r.status === 'requires_correction').length, color: 'text-warning' },
]

export default function DataCollectionPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [isNewReportOpen, setIsNewReportOpen] = useState(false)

  const filteredReports = mockDailyReports.filter(report => {
    const agent = mockAgents.find(a => a.id === report.agentId)
    const village = mockVillages.find(v => v.id === report.villageId)
    const matchesSearch = 
      agent?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      village?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getAgentName = (agentId: string) => {
    const agent = mockAgents.find(a => a.id === agentId)
    return agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown'
  }

  const getVillageName = (villageId: string) => {
    return mockVillages.find(v => v.id === villageId)?.name || 'Unknown'
  }

  const getTeamName = (teamId: string) => {
    return mockTeams.find(t => t.id === teamId)?.name || 'Unknown'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Collection</h2>
          <p className="text-muted-foreground">
            View and manage daily field reports
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Dialog open={isNewReportOpen} onOpenChange={setIsNewReportOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Daily Report</DialogTitle>
                <DialogDescription>
                  Enter the daily tally data for your assigned village.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Report Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Campaign</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCampaigns.filter(c => c.status === 'in_progress').map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Report Date</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Village</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select village" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockVillages.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tally Data */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Tally Data by Age & Gender</h4>
                  
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Age Group</TableHead>
                          <TableHead className="text-center">Male</TableHead>
                          <TableHead className="text-center">Female</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">0-11 months</TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell className="text-center font-medium">0</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">12-59 months</TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell className="text-center font-medium">0</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">5-14 years</TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell className="text-center font-medium">0</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">15+ years</TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" placeholder="0" className="w-20 mx-auto text-center" />
                          </TableCell>
                          <TableCell className="text-center font-medium">0</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Households Visited</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Children Absent</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Refusals</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>

                {/* Supply Usage */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Doses Used</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Doses Wasted</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Doses Remaining</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setIsNewReportOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-primary hover:bg-primary/90">Submit Report</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {reportStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by agent or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-transparent focus:border-primary"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="requires_correction">Needs Correction</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[160px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Village</TableHead>
                <TableHead className="text-center">Reached</TableHead>
                <TableHead className="text-center">Households</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-foreground font-medium">{formatDate(report.reportDate)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {getAgentName(report.agentId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getTeamName(report.teamId)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {getVillageName(report.villageId)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-foreground">{report.totalReached}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-muted-foreground">{report.householdsVisited}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn('capitalize flex items-center gap-1 w-fit', reportStatusColors[report.status])}
                    >
                      {reportStatusIcons[report.status]}
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Report Details</DialogTitle>
                          <DialogDescription>
                            Daily report from {getAgentName(report.agentId)} - {formatDate(report.reportDate)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Summary */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-2xl font-bold text-primary">{report.totalReached}</div>
                              <div className="text-sm text-muted-foreground">Total Reached</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-2xl font-bold text-foreground">{report.householdsVisited}</div>
                              <div className="text-sm text-muted-foreground">Households</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-2xl font-bold text-warning">{report.refusalsCount}</div>
                              <div className="text-sm text-muted-foreground">Refusals</div>
                            </div>
                          </div>

                          {/* Breakdown */}
                          <div className="rounded-lg border border-border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead>Age Group</TableHead>
                                  <TableHead className="text-center">Male</TableHead>
                                  <TableHead className="text-center">Female</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">0-11 months</TableCell>
                                  <TableCell className="text-center">{report.male0to11Months}</TableCell>
                                  <TableCell className="text-center">{report.female0to11Months}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">12-59 months</TableCell>
                                  <TableCell className="text-center">{report.male12to59Months}</TableCell>
                                  <TableCell className="text-center">{report.female12to59Months}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">5-14 years</TableCell>
                                  <TableCell className="text-center">{report.male5to14Years}</TableCell>
                                  <TableCell className="text-center">{report.female5to14Years}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">15+ years</TableCell>
                                  <TableCell className="text-center">{report.male15Plus}</TableCell>
                                  <TableCell className="text-center">{report.female15Plus}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>

                          {/* Supply Info */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg border border-border">
                              <div className="text-lg font-semibold text-foreground">{report.dosesUsed}</div>
                              <div className="text-xs text-muted-foreground">Doses Used</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border">
                              <div className="text-lg font-semibold text-destructive">{report.dosesWasted}</div>
                              <div className="text-xs text-muted-foreground">Doses Wasted</div>
                            </div>
                            <div className="p-3 rounded-lg border border-border">
                              <div className="text-lg font-semibold text-foreground">{report.childrenAbsent}</div>
                              <div className="text-xs text-muted-foreground">Children Absent</div>
                            </div>
                          </div>

                          {/* Actions */}
                          {report.status === 'submitted' && (
                            <div className="flex gap-3 pt-4 border-t border-border">
                              <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify Report
                              </Button>
                              <Button variant="outline" className="flex-1 text-warning hover:text-warning">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Request Correction
                              </Button>
                              <Button variant="outline" className="flex-1 text-destructive hover:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports found matching your criteria</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
