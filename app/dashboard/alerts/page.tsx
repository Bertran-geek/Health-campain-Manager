'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Users,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { mockAlerts, mockDistricts, mockHealthAreas, getAlertSeverityColor } from '@/lib/mock-data'
import type { Alert } from '@/lib/types'

const alertStats = [
  { label: 'Total Alerts', value: mockAlerts.length, icon: Bell, color: 'text-foreground' },
  { label: 'Critical', value: mockAlerts.filter(a => a.severity === 'critical').length, icon: AlertTriangle, color: 'text-destructive' },
  { label: 'Warning', value: mockAlerts.filter(a => a.severity === 'warning').length, icon: AlertCircle, color: 'text-warning' },
  { label: 'Info', value: mockAlerts.filter(a => a.severity === 'info').length, icon: Info, color: 'text-info' },
]

const alertTypeLabels: Record<Alert['alertType'], string> = {
  coverage_low: 'Low Coverage',
  coverage_zero: 'Zero Coverage',
  coverage_drop: 'Coverage Drop',
  no_data_submitted: 'No Data',
  agent_not_checked_in: 'Agent Missing',
  supply_low: 'Low Supply',
  gps_outside_zone: 'GPS Issue',
  data_quality_high_numbers: 'Data Quality',
  adverse_event: 'Adverse Event',
  high_refusal_rate: 'High Refusals',
  deadline_missed: 'Deadline Missed',
}

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />
      case 'warning':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: Alert['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-info" />
      case 'acknowledged':
        return <User className="h-4 w-4 text-warning" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getLocationName = (alert: Alert) => {
    if (alert.healthAreaId) {
      return mockHealthAreas.find(ha => ha.id === alert.healthAreaId)?.name
    }
    if (alert.districtId) {
      return mockDistricts.find(d => d.id === alert.districtId)?.name
    }
    return 'System-wide'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alert Center</h2>
          <p className="text-muted-foreground">
            Monitor and respond to campaign alerts
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BellOff className="mr-2 h-4 w-4" />
            Mute All
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {alertStats.map((stat, index) => {
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-transparent focus:border-primary"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card 
            key={alert.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              alert.status === 'new' && 'border-l-4',
              alert.severity === 'critical' && 'border-l-destructive',
              alert.severity === 'warning' && 'border-l-warning',
              alert.severity === 'info' && 'border-l-info'
            )}
            onClick={() => setSelectedAlert(alert)}
          >
            <CardContent className="flex items-start gap-4 pt-4">
              <div className={cn(
                'p-2 rounded-lg flex-shrink-0',
                getAlertSeverityColor(alert.severity)
              )}>
                {getSeverityIcon(alert.severity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">{alert.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(alert.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(alert.status)}
                      <span className="text-xs capitalize text-muted-foreground">
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {alertTypeLabels[alert.alertType]}
                  </Badge>
                  {getLocationName(alert) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {getLocationName(alert)}
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ))}

        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>No alerts found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedAlert && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    getAlertSeverityColor(selectedAlert.severity)
                  )}>
                    {getSeverityIcon(selectedAlert.severity)}
                  </div>
                  <div>
                    <DialogTitle>{selectedAlert.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {formatTime(selectedAlert.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <p className="text-sm text-foreground">{selectedAlert.message}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-sm font-medium text-foreground mt-1">
                      {alertTypeLabels[selectedAlert.alertType]}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm font-medium text-foreground mt-1">
                      {getLocationName(selectedAlert)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Severity</div>
                    <Badge className={cn('mt-1 capitalize', getAlertSeverityColor(selectedAlert.severity))}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {selectedAlert.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {selectedAlert.status !== 'resolved' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Resolution Notes</label>
                    <Textarea placeholder="Add notes about the resolution..." rows={3} />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  {selectedAlert.status === 'new' && (
                    <Button variant="outline" className="flex-1">
                      Acknowledge
                    </Button>
                  )}
                  {selectedAlert.status !== 'resolved' && (
                    <>
                      <Button variant="outline" className="flex-1">
                        Assign
                      </Button>
                      <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground">
                        Resolve
                      </Button>
                    </>
                  )}
                  {selectedAlert.status === 'resolved' && (
                    <Button variant="outline" className="flex-1">
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
