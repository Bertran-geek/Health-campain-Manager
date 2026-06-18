'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Syringe, HeartHandshake, Percent, RefreshCw, Loader2 } from 'lucide-react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { campaignService, reportService } from '@/lib/services'
import type { Campaign, Summary, LocalityRow } from '@/lib/services'
import { useTranslations } from 'next-intl'

// Types imported from services

const C = {
  primary: '#38BDF8',
  green: '#34D399',
  red: '#F87171',
  amber: '#FBBF24',
  purple: '#A78BFA',
  grid: 'rgba(255,255,255,0.1)',
  axis: 'rgba(255,255,255,0.5)',
}
const tooltipStyle = {
  backgroundColor: '#0D1B2E',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#E2EAF2',
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard')
  const tr = useTranslations('Reports')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState<string>('all')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [localities, setLocalities] = useState<LocalityRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    campaignService.list()
      .then(r => setCampaigns(r.data.items || []))
      .catch(console.error)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const cid = campaignId !== 'all' ? parseInt(campaignId) : undefined
    try {
      const [sumRes, locRes] = await Promise.allSettled([
        reportService.summary(cid),
        reportService.byLocality('region', cid),
      ])
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data)
      if (locRes.status === 'fulfilled') setLocalities(locRes.value.data.items || [])
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => { fetchData() }, [fetchData])

  const vaccPie = summary ? [
    { name: tr('vaccinated'), value: summary.vaccinated, color: C.green },
    { name: tr('notVaccinated'), value: summary.not_vaccinated, color: C.red },
  ] : []
  const benefPie = summary ? [
    { name: tr('beneficiary'), value: summary.beneficiaries, color: C.primary },
    { name: tr('notBeneficiary'), value: summary.not_beneficiaries, color: C.amber },
  ] : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/60 text-sm mt-1">{tr('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="w-[220px] bg-muted border-white/20 text-white">
              <SelectValue placeholder={t('selectCampaign')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              <SelectItem value="all">{tr('allCampaigns')}</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id_campaign} value={String(c.id_campaign)}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>{tr('loading')}</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={tr('totalTargets')} value={(summary?.total ?? 0).toLocaleString()} icon={Users} variant="primary" />
            <StatCard title={tr('vaccinated')} value={(summary?.vaccinated ?? 0).toLocaleString()} description={`${summary?.vaccination_rate ?? 0}%`} icon={Syringe} variant="success" />
            <StatCard title={tr('beneficiaries')} value={(summary?.beneficiaries ?? 0).toLocaleString()} description={`${summary?.beneficiary_rate ?? 0}%`} icon={HeartHandshake} variant="warning" />
            <StatCard title={tr('coverageRate')} value={`${summary?.vaccination_rate ?? 0}%`} icon={Percent} variant="default" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DonutCard title={tr('vaccinationStatus')} data={vaccPie} />
            <DonutCard title={tr('beneficiaryStatus')} data={benefPie} />
            <Card className="border-white/20 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-white">{tr('sexDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{tr('male')}</span>
                      <span className="text-white font-medium">{(summary?.male ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${summary && summary.total ? (summary.male / summary.total) * 100 : 0}%`, backgroundColor: C.primary }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{tr('female')}</span>
                      <span className="text-white font-medium">{(summary?.female ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${summary && summary.total ? (summary.female / summary.total) * 100 : 0}%`, backgroundColor: C.purple }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Locality bar chart */}
          <Card className="border-white/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white">{tr('byLocality')} — {tr('levelRegion')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={localities} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 12 }} />
                    <YAxis tick={{ fill: C.axis, fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ color: C.axis }} />
                    <Bar dataKey="vaccinated" name={tr('vaccinated')} fill={C.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="not_vaccinated" name={tr('notVaccinated')} fill={C.red} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="beneficiaries" name={tr('beneficiaries')} fill={C.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function DonutCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card className="border-white/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-white/70">{d.name}</span>
              </div>
              <span className="text-white font-medium">
                {d.value.toLocaleString()} ({total ? ((d.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
