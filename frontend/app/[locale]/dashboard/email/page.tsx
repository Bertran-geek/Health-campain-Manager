'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Send,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Swal from 'sweetalert2'
import api from '@/lib/api'
import { useTranslations, useLocale } from 'next-intl'

const SWL = { background: '#0D1B2E', color: '#E2EAF2', confirmButtonColor: '#38BDF8' }

interface EmailConfig {
  smtp_configured: boolean
  smtp_host: string
  smtp_port: number
  smtp_user: string
  from_email: string
  weekly_report_day: number
  weekly_report_hour: number
}

const DAY_OPTIONS = [
  { value: 0, label_en: 'Monday', label_fr: 'Lundi' },
  { value: 1, label_en: 'Tuesday', label_fr: 'Mardi' },
  { value: 2, label_en: 'Wednesday', label_fr: 'Mercredi' },
  { value: 3, label_en: 'Thursday', label_fr: 'Jeudi' },
  { value: 4, label_en: 'Friday', label_fr: 'Vendredi' },
  { value: 5, label_en: 'Saturday', label_fr: 'Samedi' },
  { value: 6, label_en: 'Sunday', label_fr: 'Dimanche' },
]

export default function EmailPage() {
  const t = useTranslations('Email')
  const locale = useLocale()

  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [sendingWeekly, setSendingWeekly] = useState(false)

  const [form, setForm] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    weekly_report_day: '1',
    weekly_report_hour: '8',
  })

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/emails/config')
      setConfig(res.data)
      setForm({
        smtp_host: res.data.smtp_host || 'smtp.gmail.com',
        smtp_port: String(res.data.smtp_port || 587),
        smtp_user: res.data.smtp_user || '',
        smtp_password: '',
        smtp_from_email: res.data.from_email || '',
        weekly_report_day: String(res.data.weekly_report_day ?? 1),
        weekly_report_hour: String(res.data.weekly_report_hour ?? 8),
      })
    } catch {
      Swal.fire({ icon: 'error', title: t('error'), text: t('loadError'), ...SWL })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, any> = {
        smtp_host: form.smtp_host,
        smtp_port: parseInt(form.smtp_port),
        smtp_user: form.smtp_user,
        smtp_from_email: form.smtp_from_email,
        weekly_report_day: parseInt(form.weekly_report_day),
        weekly_report_hour: parseInt(form.weekly_report_hour),
      }
      if (form.smtp_password) {
        payload.smtp_password = form.smtp_password
      }
      await api.put('/emails/config', payload)
      Swal.fire({ icon: 'success', title: t('saveSuccess'), timer: 1500, showConfirmButton: false, ...SWL })
      fetchConfig()
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('defaultError'), ...SWL })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) return
    setSendingTest(true)
    try {
      await api.post('/emails/test', { to_email: testEmail })
      Swal.fire({ icon: 'success', title: t('testSent'), timer: 1500, showConfirmButton: false, ...SWL })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('testFailed'), ...SWL })
    } finally {
      setSendingTest(false)
    }
  }

  const handleWeeklyReport = async () => {
    setSendingWeekly(true)
    try {
      await api.post('/emails/weekly-report')
      Swal.fire({ icon: 'success', title: t('weeklySent'), timer: 1500, showConfirmButton: false, ...SWL })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: t('error'), text: err.response?.data?.detail || t('weeklyFailed'), ...SWL })
    } finally {
      setSendingWeekly(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-white/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('pageTitle')}</h2>
          <p className="text-white/60 text-sm mt-1">{t('pageDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchConfig} className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-white/20 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t('statusTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {config?.smtp_configured ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {t('configured')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400">
                <XCircle className="h-4 w-4" /> {t('notConfigured')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card className="border-white/20 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">{t('smtpConfig')}</CardTitle>
          <CardDescription className="text-white/50">{t('smtpConfigDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-white">{t('smtpHost')}</Label>
              <Input
                value={form.smtp_host}
                onChange={e => setForm({ ...form, smtp_host: e.target.value })}
                className="bg-muted border-white/20 text-white"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('smtpPort')}</Label>
              <Input
                type="number"
                value={form.smtp_port}
                onChange={e => setForm({ ...form, smtp_port: e.target.value })}
                className="bg-muted border-white/20 text-white"
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-white">{t('smtpUser')}</Label>
              <Input
                type="email"
                value={form.smtp_user}
                onChange={e => setForm({ ...form, smtp_user: e.target.value })}
                className="bg-muted border-white/20 text-white"
                placeholder="your.email@gmail.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('smtpPassword')}</Label>
              <Input
                type="password"
                value={form.smtp_password}
                onChange={e => setForm({ ...form, smtp_password: e.target.value })}
                className="bg-muted border-white/20 text-white"
                placeholder={config?.smtp_configured ? '••••••••' : t('passwordPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-white">{t('fromEmail')}</Label>
            <Input
              type="email"
              value={form.smtp_from_email}
              onChange={e => setForm({ ...form, smtp_from_email: e.target.value })}
              className="bg-muted border-white/20 text-white"
              placeholder="noreply@yourdomain.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-white">{t('weeklyDay')}</Label>
              <Select value={form.weekly_report_day} onValueChange={v => setForm({ ...form, weekly_report_day: v })}>
                <SelectTrigger className="bg-muted border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {DAY_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {locale === 'fr' ? d.label_fr : d.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-white">{t('weeklyHour')}</Label>
              <Select value={form.weekly_report_hour} onValueChange={v => setForm({ ...form, weekly_report_hour: v })}>
                <SelectTrigger className="bg-muted border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/20">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('saveBtn')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test Email */}
        <Card className="border-white/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              {t('testEmailTitle')}
            </CardTitle>
            <CardDescription className="text-white/50">{t('testEmailDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white">{t('recipientEmail')}</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="bg-muted border-white/20 text-white"
                placeholder="test@gmail.com"
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={sendingTest || !testEmail || !config?.smtp_configured}
              className="bg-primary hover:bg-primary/90 text-white gap-2 w-full"
            >
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('sendTestBtn')}
            </Button>
          </CardContent>
        </Card>

        {/* Weekly Report */}
        <Card className="border-white/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              {t('weeklyReportTitle')}
            </CardTitle>
            <CardDescription className="text-white/50">{t('weeklyReportDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-white/60 text-sm">
              {t('weeklyReportInfo', {
                day: DAY_OPTIONS.find(d => d.value === config?.weekly_report_day)?.[locale === 'fr' ? 'label_fr' : 'label_en'] || 'Tuesday',
                hour: String(config?.weekly_report_hour ?? 8).padStart(2, '0'),
              })}
            </p>
            <Button
              onClick={handleWeeklyReport}
              disabled={sendingWeekly || !config?.smtp_configured}
              className="bg-primary hover:bg-primary/90 text-white gap-2 w-full"
            >
              {sendingWeekly ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              {t('sendWeeklyBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
