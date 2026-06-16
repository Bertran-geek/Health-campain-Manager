'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Syringe,
  HeartHandshake,
  Percent,
  RefreshCw,
  Loader2,
  MapPin,
} from 'lucide-react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { useTranslations } from 'next-intl'

interface Campaign { id_campaign: number; nom: string }
interface Summary {
  total: number
  vaccinated: number
  not_vaccinated: number
  beneficiaries: number
  not_beneficiaries: number
  male: number
  female: number
  vaccination_rate: number
  beneficiary_rate: number
}
interface LocalityRow {
  id: number
  name: string
  total: number
  vaccinated: number
  not_vaccinated: number
  beneficiaries: number
  not_beneficiaries: number
  coverage: number
}
interface CampaignRow extends LocalityRow { type: string }
interface AgeRow {
  age_group: string
  total: number
  vaccinated: number
  not_vaccinated: number
  beneficiaries: number
  coverage: number
}

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

export default function ReportsPage() {
  const t = useTranslations('Reports')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState<string>('all')
  const [level, setLevel] = useState<'region' | 'departement' | 'phc'>('region')

  const [summary, setSummary] = useState<Summary | null>(null)
  const [localities, setLocalities] = useState<LocalityRow[]>([])
  const [byCampaign, setByCampaign] = useState<CampaignRow[]>([])
  const [byAge, setByAge] = useState<AgeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/campaigns?page_size=100')
      .then(r => setCampaigns(r.data.items || []))
      .catch(console.error)
  }, [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const cq = campaignId !== 'all' ? `?campaign_id=${campaignId}` : ''
    const cqLevel = campaignId !== 'all' ? `?campaign_id=${campaignId}&level=${level}` : `?level=${level}`
    try {
      const [sumRes, locRes, campRes, ageRes] = await Promise.allSettled([
        api.get(`/reports/summary${cq}`),
        api.get(`/reports/by-locality${cqLevel}`),
        api.get('/reports/by-campaign'),
        api.get(`/reports/by-age${cq}`),
      ])
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data)
      if (locRes.status === 'fulfilled') setLocalities(locRes.value.data.items || [])
      if (campRes.status === 'fulfilled') setByCampaign(campRes.value.data.items || [])
      if (ageRes.status === 'fulfilled') setByAge(ageRes.value.data.items || [])
    } finally {
      setLoading(false)
    }
  }, [campaignId, level])

  useEffect(() => { fetchReports() }, [fetchReports])

  const vaccPie = summary ? [
    { name: t('vaccinated'), value: summary.vaccinated, color: C.green },
    { name: t('notVaccinated'), value: summary.not_vaccinated, color: C.red },
  ] : []
  const benefPie = summary ? [
    { name: t('beneficiary'), value: summary.beneficiaries, color: C.primary },
    { name: t('notBeneficiary'), value: summary.not_beneficiaries, color: C.amber },
  ] : []
  const sexPie = summary ? [
    { name: t('male'), value: summary.male, color: C.primary },
    { name: t('female'), value: summary.female, color: C.purple },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-white/60 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="w-[220px] bg-muted border-white/20 text-white">
              <SelectValue placeholder={t('selectCampaign')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/20">
              <SelectItem value="all">{t('allCampaigns')}</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.id_campaign} value={String(c.id_campaign)}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReports} className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>{t('loading')}</span>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label={t('totalTargets')} value={summary?.total ?? 0} color={C.primary} />
            <KpiCard icon={Syringe} label={t('vaccinated')} value={summary?.vaccinated ?? 0} sub={`${summary?.vaccination_rate ?? 0}%`} color={C.green} />
            <KpiCard icon={HeartHandshake} label={t('beneficiaries')} value={summary?.beneficiaries ?? 0} sub={`${summary?.beneficiary_rate ?? 0}%`} color={C.amber} />
            <KpiCard icon={Percent} label={t('coverageRate')} value={`${summary?.vaccination_rate ?? 0}%`} color={C.purple} />
          </div>

          {/* Pie charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PieCard title={t('vaccinationStatus')} data={vaccPie} />
            <PieCard title={t('beneficiaryStatus')} data={benefPie} />
            <PieCard title={t('sexDistribution')} data={sexPie} />
          </div>

          {/* By locality */}
          <Card className="border-white/20 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> {t('byLocality')}
              </CardTitle>
              <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                <SelectTrigger className="w-[160px] bg-muted border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  <SelectItem value="region">{t('levelRegion')}</SelectItem>
                  <SelectItem value="departement">{t('levelDepartement')}</SelectItem>
                  <SelectItem value="phc">{t('levelPhc')}</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={localities} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 12 }} />
                    <YAxis tick={{ fill: C.axis, fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ color: C.axis }} />
                    <Bar dataKey="vaccinated" name={t('vaccinated')} fill={C.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="not_vaccinated" name={t('notVaccinated')} fill={C.red} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="beneficiaries" name={t('beneficiaries')} fill={C.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <BorderedTable
                headers={[t('locality'), t('total'), t('vaccinated'), t('notVaccinated'), t('beneficiaries'), t('coverage')]}
                rows={localities.map(l => [l.name, l.total, l.vaccinated, l.not_vaccinated, l.beneficiaries, `${l.coverage}%`])}
                emptyText={t('noData')}
              />
            </CardContent>
          </Card>

          {/* By campaign */}
          <Card className="border-white/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white">{t('byCampaign')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCampaign} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 12 }} />
                    <YAxis tick={{ fill: C.axis, fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ color: C.axis }} />
                    <Bar dataKey="total" name={t('total')} fill={C.purple} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vaccinated" name={t('vaccinated')} fill={C.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="beneficiaries" name={t('beneficiaries')} fill={C.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <BorderedTable
                headers={[t('campaign'), t('total'), t('vaccinated'), t('notVaccinated'), t('beneficiaries'), t('coverage')]}
                rows={byCampaign.map(c => [c.name, c.total, c.vaccinated, c.not_vaccinated, c.beneficiaries, `${c.coverage}%`])}
                emptyText={t('noData')}
              />
            </CardContent>
          </Card>

          {/* By age */}
          <Card className="border-white/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-white">{t('byAge')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byAge} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis dataKey="age_group" tick={{ fill: C.axis, fontSize: 12 }} />
                    <YAxis tick={{ fill: C.axis, fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ color: C.axis }} />
                    <Bar dataKey="vaccinated" name={t('vaccinated')} fill={C.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="not_vaccinated" name={t('notVaccinated')} fill={C.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <BorderedTable
                headers={[t('ageGroup'), t('total'), t('vaccinated'), t('notVaccinated'), t('beneficiaries'), t('coverage')]}
                rows={byAge.map(a => [a.age_group, a.total, a.vaccinated, a.not_vaccinated, a.beneficiaries, `${a.coverage}%`])}
                emptyText={t('noData')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card className="border-white/20 bg-card">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">{label}</span>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="text-2xl font-bold text-white mt-2">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
      </CardContent>
    </Card>
  )
}

function PieCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card className="border-white/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
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

function BorderedTable({ headers, rows, emptyText }: {
  headers: string[]; rows: (string | number)[][]; emptyText: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-white/20 bg-white/5 px-3 py-2 text-left font-medium text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="border border-white/20 px-3 py-6 text-center text-white/40">
                {emptyText}
              </td>
            </tr>
          ) : rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/5">
              {row.map((cell, ci) => (
                <td key={ci} className="border border-white/20 px-3 py-2 text-white/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
