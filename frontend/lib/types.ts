// Types for Health Campaign Manager

export interface Country {
  id: string
  name: string
  code: string
  population: number
  isActive: boolean
}

export interface Region {
  id: string
  countryId: string
  name: string
  code: string
  population: number
}

export interface District {
  id: string
  regionId: string
  name: string
  code: string
  population: number
  healthFacilitiesCount: number
}

export interface HealthArea {
  id: string
  districtId: string
  name: string
  code: string
  population: number
  healthCenterName: string
  healthCenterType: 'hospital' | 'health_center' | 'health_post' | 'dispensary'
  latitude: number
  longitude: number
}

export interface Village {
  id: string
  healthAreaId: string
  name: string
  code: string
  population: number
  householdsCount: number
  childrenUnder5: number
  latitude: number
  longitude: number
  accessibility: 'easy' | 'moderate' | 'difficult' | 'very_difficult'
}

export interface Campaign {
  id: string
  name: string
  description: string
  campaignType: 'vaccination_polio' | 'vaccination_measles' | 'vaccination_covid' | 'mosquito_net' | 'vitamin_a' | 'deworming' | 'combined'
  status: 'draft' | 'approved' | 'in_progress' | 'suspended' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  targetPopulation: number
  countryId: string
  budgetAllocated: number
  currency: string
}

export interface Agent {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  healthAreaId: string
  agentType: 'vaccinator' | 'recorder' | 'mobilizer' | 'supervisor' | 'team_leader'
  isTrained: boolean
  isActive: boolean
  photoUrl?: string
}

export interface Team {
  id: string
  campaignId: string
  name: string
  code: string
  teamLeaderId: string
  healthAreaId: string
  dailyTarget: number
  members: TeamMember[]
}

export interface TeamMember {
  id: string
  teamId: string
  agentId: string
  roleInTeam: 'leader' | 'vaccinator' | 'recorder' | 'mobilizer'
}

export interface DailyReport {
  id: string
  campaignId: string
  teamId: string
  agentId: string
  villageId: string
  reportDate: string
  male0to11Months: number
  female0to11Months: number
  male12to59Months: number
  female12to59Months: number
  male5to14Years: number
  female5to14Years: number
  male15Plus: number
  female15Plus: number
  totalReached: number
  householdsVisited: number
  childrenAbsent: number
  refusalsCount: number
  dosesUsed: number
  dosesWasted: number
  status: 'submitted' | 'verified' | 'rejected' | 'requires_correction'
  gpsLatitude?: number
  gpsLongitude?: number
}

export interface Alert {
  id: string
  campaignId?: string
  alertType: 
    | 'coverage_low'
    | 'coverage_zero'
    | 'coverage_drop'
    | 'no_data_submitted'
    | 'agent_not_checked_in'
    | 'supply_low'
    | 'gps_outside_zone'
    | 'data_quality_high_numbers'
    | 'adverse_event'
    | 'high_refusal_rate'
    | 'deadline_missed'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  regionId?: string
  districtId?: string
  healthAreaId?: string
  villageId?: string
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed'
  createdAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'national_coordinator' | 'regional_supervisor' | 'district_manager' | 'health_area_manager' | 'field_supervisor' | 'field_agent' | 'viewer'
  countryId?: string
  regionId?: string
  districtId?: string
  healthAreaId?: string
  isActive: boolean
  profilePhoto?: string
}

export interface CoverageStats {
  targetPopulation: number
  totalReached: number
  coveragePercentage: number
  maleReached: number
  femaleReached: number
  byAgeGroup: {
    label: string
    reached: number
    target: number
    percentage: number
  }[]
}

export interface CampaignSummary {
  campaign: Campaign
  coverage: CoverageStats
  teamsActive: number
  teamsTotal: number
  agentsActive: number
  agentsTotal: number
  villagesCovered: number
  villagesTotal: number
  alertsNew: number
  alertsCritical: number
  dailyProgress: {
    date: string
    reached: number
    target: number
  }[]
}
