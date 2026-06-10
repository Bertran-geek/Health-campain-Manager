'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle } from 'lucide-react'

const mobileApi = axios.create({ baseURL: '/api/proxy', headers: { 'Content-Type': 'application/json' } })
mobileApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface Campaign { id_campaign: number; nom: string }
interface CHW { id_chw: number; nom: string; prenom: string | null }

const defaultForm = {
  first_name_target: '',
  last_name_target: '',
  age: '',
  sex: 'M',
  chw_id: '',
  id_campain: '',
  vaccinate: false,
  beneficiaire: false,
}

export default function RegisterTargetPage() {
  const t = useTranslations('Register')

  const [authLoading, setAuthLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [chws, setChws] = useState<CHW[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setToken(stored)
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    setDataLoading(true)
    Promise.all([
      mobileApi.get('/campaigns?page_size=100'),
      mobileApi.get('/chws?page_size=100'),
    ])
      .then(([c, h]) => {
        setCampaigns(c.data.items || [])
        setChws(h.data.items || [])
      })
      .catch(console.error)
      .finally(() => setDataLoading(false))
  }, [token])

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) return
    setLoginLoading(true)
    setLoginError('')
    try {
      const body = new URLSearchParams()
      body.append('username', loginForm.username)
      body.append('password', loginForm.password)
      body.append('grant_type', 'password')
      const res = await axios.post('/api/proxy/auth/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
    } catch {
      setLoginError(t('loginError'))
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await mobileApi.post('/targets', {
        first_name_target: form.first_name_target || null,
        last_name_target: form.last_name_target || null,
        age: form.age ? parseInt(form.age) : null,
        sex: form.sex || null,
        chw_id: form.chw_id ? parseInt(form.chw_id) : null,
        id_campain: form.id_campain ? parseInt(form.id_campain) : null,
        vaccinate: form.vaccinate,
        beneficiaire: form.beneficiaire,
      })
      setSuccess(true)
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-base focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-colors"
  const selectClass = `${inputClass} appearance-none cursor-pointer`
  const labelClass = "block text-sm font-medium text-white/70 mb-1"

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30">
              <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Health Campaign</h1>
              <p className="text-white/50 text-sm mt-1">{t('loginSubtitle')}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
            <div>
              <label className={labelClass}>{t('username')}</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                className={inputClass}
                placeholder={t('usernamePlaceholder')}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className={labelClass}>{t('password')}</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={inputClass}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading || !loginForm.username || !loginForm.password}
              className="w-full bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold rounded-xl py-3 text-base transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('loginBtn')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t('successTitle')}</h2>
            <p className="text-white/60 mt-2">{t('successText')}</p>
          </div>
          <button
            onClick={() => { setSuccess(false); setForm(defaultForm) }}
            className="w-full bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold rounded-xl py-4 text-base transition-colors"
          >
            {t('newTargetBtn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] pb-10">
      <div className="sticky top-0 z-10 bg-[#0D1B2E]/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <h1 className="text-white font-bold text-lg">{t('formTitle')}</h1>
        <p className="text-white/40 text-xs">{t('formSubtitle')}</p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
        </div>
      ) : (
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <div>
            <label className={labelClass}>{t('lastName')}</label>
            <input
              type="text"
              value={form.last_name_target}
              onChange={e => setForm({ ...form, last_name_target: e.target.value })}
              className={inputClass}
              placeholder={t('lastNamePlaceholder')}
            />
          </div>

          <div>
            <label className={labelClass}>{t('firstName')}</label>
            <input
              type="text"
              value={form.first_name_target}
              onChange={e => setForm({ ...form, first_name_target: e.target.value })}
              className={inputClass}
              placeholder={t('firstNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('age')}</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                className={inputClass}
                placeholder="0"
                min="0"
                max="120"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className={labelClass}>{t('sex')}</label>
              <select
                value={form.sex}
                onChange={e => setForm({ ...form, sex: e.target.value })}
                className={selectClass}
              >
                <option value="M" className="bg-[#0D1B2E]">{t('male')}</option>
                <option value="F" className="bg-[#0D1B2E]">{t('female')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('campaign')}</label>
            <select
              value={form.id_campain}
              onChange={e => setForm({ ...form, id_campain: e.target.value })}
              className={selectClass}
            >
              <option value="" className="bg-[#0D1B2E]">{t('selectCampaign')}</option>
              {campaigns.map(c => (
                <option key={c.id_campaign} value={String(c.id_campaign)} className="bg-[#0D1B2E]">{c.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t('chw')}</label>
            <select
              value={form.chw_id}
              onChange={e => setForm({ ...form, chw_id: e.target.value })}
              className={selectClass}
            >
              <option value="" className="bg-[#0D1B2E]">{t('selectChw')}</option>
              {chws.map(c => (
                <option key={c.id_chw} value={String(c.id_chw)} className="bg-[#0D1B2E]">
                  {c.nom}{c.prenom ? ` ${c.prenom}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.vaccinate}
                onChange={e => setForm({ ...form, vaccinate: e.target.checked })}
                className="w-5 h-5 rounded accent-sky-400 cursor-pointer"
              />
              <span className="text-white text-base">{t('vaccinated')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.beneficiaire}
                onChange={e => setForm({ ...form, beneficiaire: e.target.checked })}
                className="w-5 h-5 rounded accent-sky-400 cursor-pointer"
              />
              <span className="text-white text-base">{t('beneficiary')}</span>
            </label>
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-semibold rounded-xl py-4 text-base transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('submitBtn')}
          </button>
        </div>
      )}
    </div>
  )
}
