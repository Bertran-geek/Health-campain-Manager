'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/lib/types'
import { getCampaignTypeLabel, getStatusColor } from '@/lib/mock-data'

interface CampaignCardProps {
  campaign: Campaign
  coverage?: number
}

export function CampaignCard({ campaign, coverage }: CampaignCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-foreground line-clamp-1">
              {campaign.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {getCampaignTypeLabel(campaign.campaignType)}
            </Badge>
          </div>
          <Badge className={cn('text-xs capitalize', getStatusColor(campaign.status))}>
            {campaign.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(campaign.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{(campaign.targetPopulation / 1000000).toFixed(1)}M target</span>
          </div>
        </div>

        {coverage !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coverage</span>
              <span className="font-medium text-foreground">{coverage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  coverage >= 90 ? 'bg-success' : 
                  coverage >= 70 ? 'bg-primary' : 
                  coverage >= 50 ? 'bg-warning' : 'bg-destructive'
                )}
                style={{ width: `${Math.min(coverage, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Budget: ${campaign.budgetAllocated.toLocaleString()}
          </span>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            View details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
