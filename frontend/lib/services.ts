/**
 * API service layer for Health Campaign Manager.
 * Separates HTTP calls from page components for maintainability.
 */

import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Target {
  id_target: number
  first_name_target: string | null
  last_name_target: string | null
  age: number | null
  sex: string | null
  chw_id: number | null
  vaccinate: boolean
  id_campain: number | null
  beneficiaire: boolean
}

export interface Campaign {
  id_campaign: number
  nom: string
  code: string
  description?: string
  type_campagne: string
  date_debut: string
  date_fin: string
  actif: boolean
  sexe: string
  nombre_dose: number
  age_min?: number
  age_max?: number
  total_personne?: number
  created_at: string
  molecules: Molecule[]
  zones: CampaignZone[]
}

export interface Molecule {
  id_molecule: number
  nom: string
  code: string
  description?: string
  nombre_dose_standard: number
}

export interface CampaignZone {
  id_zone?: number
  niveau: string
  id_region?: number
  id_dpt?: number
  id_phc?: number
}

export interface Region {
  id_region: number
  nom_region: string
}

export interface Department {
  id_dpt: number
  nom_dpt: string
  id_region: number
}

export interface CHW {
  id_chw: number
  nom: string
  prenom: string | null
}

export interface Role {
  id_role: number
  code: string
  nom: string
}

export interface Scope {
  niveau: string
  id_region?: number | null
}

export interface Agent {
  id_user: number
  username: string
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  actif: boolean
  roles: Role[]
  scopes: Scope[]
  created_at: string
}

export interface Summary {
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

export interface LocalityRow {
  id: number
  name: string
  total: number
  vaccinated: number
  not_vaccinated: number
  beneficiaries: number
  coverage: number
}

export interface EmailConfig {
  smtp_configured: boolean
  smtp_host: string
  smtp_port: number
  smtp_user: string
  from_email: string
  weekly_report_day: number
  weekly_report_hour: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ─── Target Service ───────────────────────────────────────────────────────────

export const targetService = {
  list: (limit = 500) =>
    api.get<PaginatedResponse<Target>>(`/targets?limit=${limit}`),

  get: (id: number) =>
    api.get<Target>(`/targets/${id}`),

  create: (data: Partial<Target>) =>
    api.post<Target>('/targets', data),

  update: (id: number, data: Partial<Target>) =>
    api.put<Target>(`/targets/${id}`, data),

  delete: (id: number) =>
    api.delete(`/targets/${id}`),

  toggleVaccinate: (target: Target) =>
    api.put<Target>(`/targets/${target.id_target}`, { vaccinate: !target.vaccinate }),

  toggleBeneficiaire: (target: Target) =>
    api.put<Target>(`/targets/${target.id_target}`, { beneficiaire: !target.beneficiaire }),
}

// ─── Campaign Service ─────────────────────────────────────────────────────────

export const campaignService = {
  list: (page = 1, pageSize = 100) =>
    api.get<PaginatedResponse<Campaign>>(`/campaigns?page=${page}&page_size=${pageSize}`),

  get: (id: number) =>
    api.get<Campaign>(`/campaigns/${id}`),

  create: (data: Record<string, any>) =>
    api.post<Campaign>('/campaigns', data),

  update: (id: number, data: Record<string, any>) =>
    api.put<Campaign>(`/campaigns/${id}`, data),

  delete: (id: number) =>
    api.delete(`/campaigns/${id}`),
}

// ─── Molecule Service ─────────────────────────────────────────────────────────

export const moleculeService = {
  list: () =>
    api.get<Molecule[]>('/molecules'),

  create: (data: Partial<Molecule>) =>
    api.post<Molecule>('/molecules', data),

  update: (id: number, data: Partial<Molecule>) =>
    api.put<Molecule>(`/molecules/${id}`, data),

  delete: (id: number) =>
    api.delete(`/molecules/${id}`),
}

// ─── Geography Service ────────────────────────────────────────────────────────

export const geographyService = {
  listRegions: (pageSize = 100) =>
    api.get<PaginatedResponse<Region>>(`/regions?page_size=${pageSize}`),

  listDepartments: (pageSize = 500) =>
    api.get<PaginatedResponse<Department>>(`/departements?page_size=${pageSize}`),

  listChws: (pageSize = 100) =>
    api.get<PaginatedResponse<CHW>>(`/chws?page_size=${pageSize}`),
}

// ─── User / Agent Service ─────────────────────────────────────────────────────

export const userService = {
  list: () =>
    api.get<PaginatedResponse<Agent>>('/users'),

  get: (id: number) =>
    api.get<Agent>(`/users/${id}`),

  create: (data: Record<string, any>) =>
    api.post<Agent>('/users', data),

  update: (id: number, data: Record<string, any>) =>
    api.put<Agent>(`/users/${id}`, data),

  delete: (id: number) =>
    api.delete(`/users/${id}`),

  listRoles: () =>
    api.get<Role[]>('/users/roles'),

  toggleActive: (agent: Agent) =>
    api.put<Agent>(`/users/${agent.id_user}`, { actif: !agent.actif }),
}

// ─── Reports Service ──────────────────────────────────────────────────────────

export const reportService = {
  summary: (campaignId?: number) => {
    const q = campaignId ? `?campaign_id=${campaignId}` : ''
    return api.get<Summary>(`/reports/summary${q}`)
  },

  byLocality: (level = 'region', campaignId?: number) => {
    const params = new URLSearchParams({ level })
    if (campaignId) params.set('campaign_id', String(campaignId))
    return api.get<PaginatedResponse<LocalityRow>>(`/reports/by-locality?${params}`)
  },

  byCampaign: () =>
    api.get<PaginatedResponse<{ name: string; total: number; vaccinated: number; not_vaccinated: number; beneficiaries: number; coverage: number; type: string }>>('/reports/by-campaign'),

  byAge: (campaignId?: number) => {
    const q = campaignId ? `?campaign_id=${campaignId}` : ''
    return api.get<PaginatedResponse<{ age_group: string; total: number; vaccinated: number; not_vaccinated: number; beneficiaries: number; coverage: number }>>(`/reports/by-age${q}`)
  },
}

// ─── Email Service ────────────────────────────────────────────────────────────

export const emailService = {
  getConfig: () =>
    api.get<EmailConfig>('/emails/config'),

  updateConfig: (data: Record<string, any>) =>
    api.put<EmailConfig>('/emails/config', data),

  sendTest: (toEmail: string) =>
    api.post('/emails/test', { to_email: toEmail }),

  triggerWeeklyReport: () =>
    api.post('/emails/weekly-report'),
}
