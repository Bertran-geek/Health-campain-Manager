'use client'

import { Users, Target, MapPin, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { CoverageCard } from '@/components/dashboard/coverage-card'
import { AlertsCard } from '@/components/dashboard/alerts-card'
import { DailyProgressChart } from '@/components/dashboard/daily-progress-chart'
import { CampaignCard } from '@/components/dashboard/campaign-card'
import { mockCampaignSummary, mockCampaigns, mockAlerts } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const summary = mockCampaignSummary
  const t = useTranslations('Dashboard')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground">
            {summary.campaign.name} - {t('daySuffix', {day: Math.ceil((new Date().getTime() - new Date(summary.campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))})}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="camp1">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('selectCampaign')} />
            </SelectTrigger>
            <SelectContent>
              {mockCampaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {t('exportReport')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalReached')}
          value={summary.coverage.totalReached.toLocaleString()}
          description={t('childrenVaccinated')}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title={t('coverageRate')}
          value={`${summary.coverage.coveragePercentage.toFixed(1)}%`}
          description={t('targetPopulation')}
          icon={Target}
          trend={{ value: 8.2, isPositive: true }}
          variant="success"
        />
        <StatCard
          title={t('activeTeams')}
          value={`${summary.teamsActive}/${summary.teamsTotal}`}
          description={t('teamsDeployed')}
          icon={MapPin}
          variant="default"
        />
        <StatCard
          title={t('activeAlerts')}
          value={summary.alertsNew}
          description={t('criticalCount', {count: summary.alertsCritical})}
          icon={AlertTriangle}
          variant={summary.alertsCritical > 0 ? 'destructive' : 'warning'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Coverage and Progress */}
        <div className="lg:col-span-2 space-y-6">
          <DailyProgressChart data={summary.dailyProgress} />
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">{summary.villagesCovered}</div>
                <div className="text-sm text-muted-foreground">{t('villagesCovered')}</div>
                <div className="text-xs text-primary mt-1">
                  {t('ofTotal', {total: summary.villagesTotal})}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">{summary.agentsActive}</div>
                <div className="text-sm text-muted-foreground">{t('agentsActive')}</div>
                <div className="text-xs text-success mt-1">
                  {t('checkedIn', {pct: ((summary.agentsActive / summary.agentsTotal) * 100).toFixed(0)})}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">
                  {((summary.dailyProgress[summary.dailyProgress.length - 1]?.reached || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">{t('todaysProgress')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('targetValue', {val: ((summary.dailyProgress[0]?.target || 0) / 1000).toFixed(0)})}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-foreground">
                  {(summary.campaign.budgetAllocated / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">{t('budget')}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('allocatedForCampaign')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Coverage Details */}
        <div className="space-y-6">
          <CoverageCard coverage={summary.coverage} />
        </div>
      </div>

      {/* Bottom Section - Alerts and Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsCard alerts={mockAlerts} />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">{t('activeCampaigns')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              {t('viewAll')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockCampaigns.filter(c => c.status === 'in_progress' || c.status === 'approved').slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{campaign.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                </div>
                <Badge className={`${campaign.status === 'in_progress' ? 'bg-success/20 text-success' : 'bg-info/20 text-info'}`}>
                  {campaign.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
