'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'
import { getAlertSeverityColor } from '@/lib/mock-data'

interface AlertsCardProps {
  alerts: Alert[]
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          View all
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                getAlertSeverityColor(alert.severity)
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(alert.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {alert.alertType.replace(/_/g, ' ')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      alert.status === 'new' && 'bg-primary/10 text-primary border-primary/30',
                      alert.status === 'acknowledged' && 'bg-warning/10 text-warning border-warning/30',
                      alert.status === 'in_progress' && 'bg-info/10 text-info border-info/30',
                      alert.status === 'resolved' && 'bg-success/10 text-success border-success/30'
                    )}
                  >
                    {alert.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts at this time</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
