// Mock data for Health Campaign Manager demo

import type { Campaign, Country, Region, District, HealthArea, Village, Agent, Team, DailyReport, Alert, User, CampaignSummary } from './types'

export const mockCountries: Country[] = [
  { id: 'cod', name: 'Democratic Republic of Congo', code: 'COD', population: 95890000, isActive: true },
  { id: 'nga', name: 'Nigeria', code: 'NGA', population: 213400000, isActive: true },
  { id: 'eth', name: 'Ethiopia', code: 'ETH', population: 117900000, isActive: true },
]

export const mockRegions: Region[] = [
  { id: 'kin', countryId: 'cod', name: 'Kinshasa', code: 'KIN', population: 15000000 },
  { id: 'hka', countryId: 'cod', name: 'Haut-Katanga', code: 'HKA', population: 5200000 },
  { id: 'nki', countryId: 'cod', name: 'Nord-Kivu', code: 'NKI', population: 6500000 },
  { id: 'ski', countryId: 'cod', name: 'Sud-Kivu', code: 'SKI', population: 5800000 },
  { id: 'equ', countryId: 'cod', name: 'Equateur', code: 'EQU', population: 4100000 },
]

export const mockDistricts: District[] = [
  { id: 'd1', regionId: 'kin', name: 'Gombe', code: 'GOM', population: 120000, healthFacilitiesCount: 15 },
  { id: 'd2', regionId: 'kin', name: 'Lingwala', code: 'LNG', population: 380000, healthFacilitiesCount: 22 },
  { id: 'd3', regionId: 'kin', name: 'Barumbu', code: 'BAR', population: 260000, healthFacilitiesCount: 18 },
  { id: 'd4', regionId: 'hka', name: 'Lubumbashi', code: 'LUB', population: 2500000, healthFacilitiesCount: 45 },
  { id: 'd5', regionId: 'nki', name: 'Goma', code: 'GOM', population: 1200000, healthFacilitiesCount: 32 },
]

export const mockHealthAreas: HealthArea[] = [
  { id: 'ha1', districtId: 'd1', name: 'Gombe Central', code: 'GC01', population: 45000, healthCenterName: 'CS Gombe', healthCenterType: 'health_center', latitude: -4.3000, longitude: 15.3000 },
  { id: 'ha2', districtId: 'd1', name: 'Gombe Nord', code: 'GN01', population: 38000, healthCenterName: 'CS Gombe Nord', healthCenterType: 'health_center', latitude: -4.2800, longitude: 15.3100 },
  { id: 'ha3', districtId: 'd2', name: 'Lingwala Centre', code: 'LC01', population: 62000, healthCenterName: 'CS Lingwala', healthCenterType: 'health_center', latitude: -4.3200, longitude: 15.2900 },
]

export const mockVillages: Village[] = [
  { id: 'v1', healthAreaId: 'ha1', name: 'Quartier 1', code: 'Q1', population: 8500, householdsCount: 1420, childrenUnder5: 1275, latitude: -4.3010, longitude: 15.3010, accessibility: 'easy' },
  { id: 'v2', healthAreaId: 'ha1', name: 'Quartier 2', code: 'Q2', population: 7200, householdsCount: 1200, childrenUnder5: 1080, latitude: -4.3020, longitude: 15.3020, accessibility: 'easy' },
  { id: 'v3', healthAreaId: 'ha1', name: 'Quartier 3', code: 'Q3', population: 9100, householdsCount: 1517, childrenUnder5: 1365, latitude: -4.3030, longitude: 15.3030, accessibility: 'moderate' },
  { id: 'v4', healthAreaId: 'ha2', name: 'Secteur A', code: 'SA', population: 6800, householdsCount: 1133, childrenUnder5: 1020, latitude: -4.2810, longitude: 15.3110, accessibility: 'easy' },
  { id: 'v5', healthAreaId: 'ha2', name: 'Secteur B', code: 'SB', population: 5400, householdsCount: 900, childrenUnder5: 810, latitude: -4.2820, longitude: 15.3120, accessibility: 'difficult' },
]

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1',
    name: 'Polio Round 3 - Kinshasa 2024',
    description: 'Third round of polio vaccination campaign targeting children under 5 in Kinshasa province',
    campaignType: 'vaccination_polio',
    status: 'in_progress',
    startDate: '2024-03-15',
    endDate: '2024-03-19',
    targetPopulation: 2850000,
    countryId: 'cod',
    budgetAllocated: 1250000,
    currency: 'USD'
  },
  {
    id: 'camp2',
    name: 'Measles SIA - Nord-Kivu',
    description: 'Supplementary immunization activity for measles in Nord-Kivu',
    campaignType: 'vaccination_measles',
    status: 'approved',
    startDate: '2024-04-01',
    endDate: '2024-04-07',
    targetPopulation: 1200000,
    countryId: 'cod',
    budgetAllocated: 890000,
    currency: 'USD'
  },
  {
    id: 'camp3',
    name: 'Mosquito Net Distribution - Equateur',
    description: 'Mass distribution of insecticide-treated mosquito nets',
    campaignType: 'mosquito_net',
    status: 'draft',
    startDate: '2024-05-10',
    endDate: '2024-05-20',
    targetPopulation: 980000,
    countryId: 'cod',
    budgetAllocated: 450000,
    currency: 'USD'
  },
]

export const mockAgents: Agent[] = [
  { id: 'a1', firstName: 'Jean', lastName: 'Mukendi', phone: '+243812345678', email: 'jean.m@health.cd', healthAreaId: 'ha1', agentType: 'team_leader', isTrained: true, isActive: true },
  { id: 'a2', firstName: 'Marie', lastName: 'Kabila', phone: '+243823456789', healthAreaId: 'ha1', agentType: 'vaccinator', isTrained: true, isActive: true },
  { id: 'a3', firstName: 'Pierre', lastName: 'Lumumba', phone: '+243834567890', healthAreaId: 'ha1', agentType: 'recorder', isTrained: true, isActive: true },
  { id: 'a4', firstName: 'Sophie', lastName: 'Ngalula', phone: '+243845678901', healthAreaId: 'ha1', agentType: 'mobilizer', isTrained: true, isActive: true },
  { id: 'a5', firstName: 'Claude', lastName: 'Tshisekedi', phone: '+243856789012', healthAreaId: 'ha2', agentType: 'team_leader', isTrained: true, isActive: true },
  { id: 'a6', firstName: 'Anne', lastName: 'Mbuyi', phone: '+243867890123', healthAreaId: 'ha2', agentType: 'vaccinator', isTrained: false, isActive: true },
]

export const mockTeams: Team[] = [
  { id: 't1', campaignId: 'camp1', name: 'Team Alpha', code: 'TA01', teamLeaderId: 'a1', healthAreaId: 'ha1', dailyTarget: 250, members: [] },
  { id: 't2', campaignId: 'camp1', name: 'Team Beta', code: 'TB01', teamLeaderId: 'a5', healthAreaId: 'ha2', dailyTarget: 200, members: [] },
]

export const mockDailyReports: DailyReport[] = [
  {
    id: 'dr1', campaignId: 'camp1', teamId: 't1', agentId: 'a1', villageId: 'v1', reportDate: '2024-03-15',
    male0to11Months: 45, female0to11Months: 52, male12to59Months: 89, female12to59Months: 95,
    male5to14Years: 0, female5to14Years: 0, male15Plus: 0, female15Plus: 0,
    totalReached: 281, householdsVisited: 156, childrenAbsent: 12, refusalsCount: 3,
    dosesUsed: 281, dosesWasted: 5, status: 'verified', gpsLatitude: -4.3010, gpsLongitude: 15.3010
  },
  {
    id: 'dr2', campaignId: 'camp1', teamId: 't1', agentId: 'a1', villageId: 'v2', reportDate: '2024-03-15',
    male0to11Months: 38, female0to11Months: 41, male12to59Months: 72, female12to59Months: 78,
    male5to14Years: 0, female5to14Years: 0, male15Plus: 0, female15Plus: 0,
    totalReached: 229, householdsVisited: 132, childrenAbsent: 8, refusalsCount: 1,
    dosesUsed: 229, dosesWasted: 3, status: 'verified', gpsLatitude: -4.3020, gpsLongitude: 15.3020
  },
  {
    id: 'dr3', campaignId: 'camp1', teamId: 't2', agentId: 'a5', villageId: 'v4', reportDate: '2024-03-15',
    male0to11Months: 32, female0to11Months: 35, male12to59Months: 61, female12to59Months: 58,
    male5to14Years: 0, female5to14Years: 0, male15Plus: 0, female15Plus: 0,
    totalReached: 186, householdsVisited: 98, childrenAbsent: 15, refusalsCount: 5,
    dosesUsed: 186, dosesWasted: 2, status: 'submitted', gpsLatitude: -4.2810, gpsLongitude: 15.3110
  },
]

export const mockAlerts: Alert[] = [
  {
    id: 'al1', campaignId: 'camp1', alertType: 'coverage_low', severity: 'warning',
    title: 'Low Coverage in Secteur B', message: 'Coverage rate at 42% - below 80% target threshold',
    districtId: 'd1', healthAreaId: 'ha2', villageId: 'v5', status: 'new', createdAt: '2024-03-15T14:30:00Z'
  },
  {
    id: 'al2', campaignId: 'camp1', alertType: 'high_refusal_rate', severity: 'critical',
    title: 'High Refusal Rate Alert', message: '8.2% refusal rate exceeds 5% threshold - community sensitization needed',
    districtId: 'd1', healthAreaId: 'ha2', status: 'acknowledged', createdAt: '2024-03-15T11:15:00Z'
  },
  {
    id: 'al3', campaignId: 'camp1', alertType: 'agent_not_checked_in', severity: 'info',
    title: 'Agent Check-in Pending', message: 'Agent Anne Mbuyi has not checked in for today',
    healthAreaId: 'ha2', status: 'new', createdAt: '2024-03-15T09:00:00Z'
  },
  {
    id: 'al4', alertType: 'supply_low', severity: 'warning',
    title: 'Vaccine Supply Running Low', message: 'OPV stock at 15% in Gombe district warehouse',
    districtId: 'd1', status: 'in_progress', createdAt: '2024-03-14T16:45:00Z'
  },
]

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@health.cd', firstName: 'Admin', lastName: 'System', role: 'super_admin', isActive: true },
  { id: 'u2', email: 'coordinator@health.cd', firstName: 'Paul', lastName: 'Mbeki', role: 'national_coordinator', countryId: 'cod', isActive: true },
  { id: 'u3', email: 'supervisor.kin@health.cd', firstName: 'Grace', lastName: 'Okello', role: 'regional_supervisor', countryId: 'cod', regionId: 'kin', isActive: true },
]

export const mockCampaignSummary: CampaignSummary = {
  campaign: mockCampaigns[0],
  coverage: {
    targetPopulation: 2850000,
    totalReached: 1897450,
    coveragePercentage: 66.6,
    maleReached: 912378,
    femaleReached: 985072,
    byAgeGroup: [
      { label: '0-11 months', reached: 428500, target: 570000, percentage: 75.2 },
      { label: '12-59 months', reached: 1468950, target: 2280000, percentage: 64.4 },
    ]
  },
  teamsActive: 142,
  teamsTotal: 156,
  agentsActive: 568,
  agentsTotal: 624,
  villagesCovered: 1245,
  villagesTotal: 1580,
  alertsNew: 23,
  alertsCritical: 4,
  dailyProgress: [
    { date: '2024-03-15', reached: 485200, target: 570000 },
    { date: '2024-03-16', reached: 512300, target: 570000 },
    { date: '2024-03-17', reached: 478900, target: 570000 },
    { date: '2024-03-18', reached: 421050, target: 570000 },
  ]
}

export function getCampaignTypeLabel(type: Campaign['campaignType']): string {
  const labels: Record<Campaign['campaignType'], string> = {
    vaccination_polio: 'Polio Vaccination',
    vaccination_measles: 'Measles Vaccination',
    vaccination_covid: 'COVID-19 Vaccination',
    mosquito_net: 'Mosquito Net Distribution',
    vitamin_a: 'Vitamin A Supplementation',
    deworming: 'Deworming',
    combined: 'Combined Campaign',
  }
  return labels[type]
}

export function getStatusColor(status: Campaign['status']): string {
  const colors: Record<Campaign['status'], string> = {
    draft: 'bg-muted text-muted-foreground',
    approved: 'bg-info/20 text-info',
    in_progress: 'bg-success/20 text-success',
    suspended: 'bg-warning/20 text-warning',
    completed: 'bg-primary/20 text-primary',
    cancelled: 'bg-destructive/20 text-destructive',
  }
  return colors[status]
}

export function getAlertSeverityColor(severity: Alert['severity']): string {
  const colors: Record<Alert['severity'], string> = {
    info: 'border-info/50 bg-info/10 text-info',
    warning: 'border-warning/50 bg-warning/10 text-warning',
    critical: 'border-destructive/50 bg-destructive/10 text-destructive',
  }
  return colors[severity]
}
