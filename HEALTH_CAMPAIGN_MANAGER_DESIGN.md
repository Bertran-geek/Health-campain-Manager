# Health Campaign Manager - Detailed Design Specification

## Overview

A comprehensive web platform for managing public health campaigns (vaccination, mosquito net distribution, vitamin A supplementation, deworming) in African countries. The system replaces Excel, WhatsApp, and paper-based tracking with real-time digital monitoring.

---

## Problem Statement

Health administrators in African countries face critical challenges:
- **No real-time coverage tracking** - Data arrives days or weeks late
- **Cannot identify underperforming zones** - No geographic visibility
- **Limited field team oversight** - No way to monitor agent activities
- **Data consolidation issues** - Manual aggregation from district to national level is error-prone

---

## Core Features

### 1. Administrative Hierarchy Management

#### 1.1 Geographic Structure
```
Country
  └── Region
        └── District
              └── Health Area (Aire Sanitaire)
                    └── Village
```

**Country Management**
- Create/Edit/Delete countries
- Set country-level health targets
- Assign national coordinators
- Configure country-specific settings (language, timezone, currency)

**Region Management**
- Link regions to parent country
- Set regional population data
- Assign regional supervisors
- Define regional health targets

**District Management**
- Link districts to parent region
- Manage district health officers
- Set district-level objectives
- Track district resources (vaccines, supplies)

**Health Area Management**
- Link to parent district
- Assign health area managers
- Define catchment population
- Map health facilities

**Village Management**
- Link to parent health area
- Record GPS coordinates
- Store population census data
- Track household count
- Note accessibility information (road conditions, distance)

---

### 2. Campaign Management

#### 2.1 Campaign Creation
**Basic Information**
- Campaign name
- Campaign type (dropdown):
  - Vaccination (Polio, Measles, COVID-19, etc.)
  - Mosquito Net Distribution
  - Vitamin A Supplementation
  - Deworming
  - Combined Campaign
- Description
- Status (Draft, Active, Completed, Cancelled)

**Timeline**
- Planning start date
- Planning end date
- Campaign start date
- Campaign end date
- Daily reporting deadline (e.g., 6:00 PM local time)

**Targets**
- Target population (total)
- Target by age group:
  - 0-11 months
  - 12-59 months
  - 5-14 years
  - 15+ years
- Target by gender (if applicable)
- Geographic scope (select countries, regions, districts)

**Resources**
- Vaccine/supply allocation per district
- Equipment needed (coolers, markers, tally sheets)
- Budget allocation

#### 2.2 Campaign Workflow
```
Draft → Approved → In Progress → Completed
                 ↓
              Suspended
```

---

### 3. Agent Management

#### 3.1 Agent Registration
- Full name
- Phone number (primary + secondary)
- Email (optional)
- National ID number
- Photo upload
- Assigned health area
- Agent type:
  - Vaccinator
  - Recorder
  - Supervisor
  - Team Leader
- Training status (Trained/Not Trained)
- Training date
- Bank account details (for payment)

#### 3.2 Team Assignment
- Create teams (2-3 agents per team)
- Assign team leader
- Assign geographic zone (villages/sectors)
- Set daily targets
- Provide route/itinerary

#### 3.3 Performance Tracking
- Daily children vaccinated/reached
- Households visited
- Doses administered by type
- Refusals recorded
- Adverse events reported
- Comparison to target (% achieved)

#### 3.4 Attendance Monitoring
- Daily check-in (GPS + timestamp)
- Daily check-out (GPS + timestamp)
- Break tracking
- Absence reporting with reason
- Supervisor verification

---

### 4. Data Collection

#### 4.1 Daily Reporting Form
**Header**
- Date
- Campaign
- Team/Agent
- Village/Zone
- Auto-captured GPS coordinates

**Tally Data**
| Age Group | Male | Female | Total |
|-----------|------|--------|-------|
| 0-11 months | | | |
| 12-59 months | | | |
| 5-14 years | | | |

**Additional Metrics**
- Households visited
- Children absent
- Refusals (with reasons dropdown)
- Adverse events (with severity)
- Supplies used
- Supplies remaining

**Notes**
- Free text field for observations
- Photo upload capability

#### 4.2 Supervisor Verification
- Verify agent reports
- Spot-check household visits
- Approve/reject submissions
- Add supervisor notes

---

### 5. Real-Time Dashboard

#### 5.1 Executive Dashboard (National Level)
**Key Metrics Cards**
- Total target population
- Total reached
- Overall coverage percentage
- Days remaining
- Active agents today

**Coverage Map**
- Interactive Leaflet map
- Color-coded by coverage:
  - Green: ≥95%
  - Yellow: 80-94%
  - Orange: 50-79%
  - Red: <50%
- Click region/district for drill-down
- Toggle between: Country → Region → District → Health Area

**Trend Charts**
- Daily progress line chart
- Cumulative coverage area chart
- Coverage by region bar chart
- Agent performance distribution

**Alerts Panel**
- Regions below target
- Districts with no data today
- Agents not checked in
- Supply shortages reported

#### 5.2 Regional Dashboard
- Same metrics filtered by region
- District-level breakdown
- Agent leaderboard

#### 5.3 District Dashboard
- Health area breakdown
- Team performance comparison
- Village-level data table

---

### 6. Alert System

#### 6.1 Automatic Alerts
**Coverage Alerts**
- District below 50% at midpoint
- Village with 0% coverage for 2+ days
- Sudden drop in daily numbers

**Operational Alerts**
- Agent not checked in by 9 AM
- No data submitted by deadline
- Supply stock below threshold
- GPS location outside assigned zone

**Quality Alerts**
- Unusually high numbers (data quality check)
- Adverse event reported
- High refusal rate (>5%)

#### 6.2 Alert Delivery
- In-app notifications
- SMS to supervisors
- Email digest (daily summary)
- WhatsApp integration (optional)

#### 6.3 Alert Management
- Mark as read/resolved
- Assign follow-up action
- Add resolution notes
- Escalation workflow

---

### 7. Reporting Module

#### 7.1 Standard Reports
**Daily Report**
- Coverage by district
- Agent attendance summary
- Issues/alerts summary

**Weekly Report**
- Week-over-week comparison
- Top/bottom performing areas
- Resource utilization

**Final Campaign Report**
- Total coverage achieved
- Geographic breakdown
- Lessons learned section
- Cost analysis

#### 7.2 Custom Reports
- Select metrics
- Select geographic scope
- Select date range
- Choose grouping (by region, district, agent)

#### 7.3 Export Formats
- PDF (formatted report with charts)
- Excel (raw data + pivot tables)
- CSV (for data analysis)

---

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, manage countries, system settings |
| **National Coordinator** | Manage campaigns, view all data, manage regions |
| **Regional Supervisor** | Manage districts, view regional data, approve reports |
| **District Manager** | Manage health areas, assign agents, view district data |
| **Health Area Manager** | Manage villages, verify agent reports |
| **Field Supervisor** | Monitor teams, verify data, manage attendance |
| **Field Agent** | Submit daily reports, check-in/out |
| **Viewer** | Read-only access to dashboards and reports |

---

## Technical Architecture

### Backend (Laravel)
```
app/
├── Models/
│   ├── Country.php
│   ├── Region.php
│   ├── District.php
│   ├── HealthArea.php
│   ├── Village.php
│   ├── Campaign.php
│   ├── CampaignTarget.php
│   ├── Agent.php
│   ├── Team.php
│   ├── DailyReport.php
│   ├── Attendance.php
│   ├── Alert.php
│   └── User.php
├── Http/Controllers/Api/
│   ├── CampaignController.php
│   ├── ReportController.php
│   ├── DashboardController.php
│   ├── AgentController.php
│   └── ExportController.php
└── Services/
    ├── CoverageCalculator.php
    ├── AlertService.php
    └── ReportGenerator.php
```

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── dashboard/
│   │   ├── CoverageMap.tsx
│   │   ├── MetricsCards.tsx
│   │   ├── TrendCharts.tsx
│   │   └── AlertsPanel.tsx
│   ├── campaigns/
│   │   ├── CampaignForm.tsx
│   │   ├── CampaignList.tsx
│   │   └── CampaignDetails.tsx
│   ├── agents/
│   │   ├── AgentTable.tsx
│   │   ├── AgentForm.tsx
│   │   └── AttendanceTracker.tsx
│   └── reports/
│       ├── ReportBuilder.tsx
│       └── ReportViewer.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Campaigns.tsx
│   ├── Agents.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useCampaigns.ts
│   ├── useCoverage.ts
│   └── useAlerts.ts
└── types/
    └── index.ts
```

### Database Schema (MySQL)

**Key Tables**
- `countries` - Country master data
- `regions` - Region hierarchy
- `districts` - District hierarchy
- `health_areas` - Health area data
- `villages` - Village with GPS coordinates
- `campaigns` - Campaign definitions
- `campaign_targets` - Targets by geography
- `agents` - Field agent profiles
- `teams` - Team compositions
- `daily_reports` - Collected field data
- `attendance_logs` - Agent check-in/out
- `alerts` - System-generated alerts
- `users` - System users with roles

### Mapping (Leaflet)
- GeoJSON boundaries for countries/regions/districts
- Marker clusters for villages
- Choropleth layers for coverage visualization
- Custom popups with key metrics
- Layer controls for data overlays

---

## UI/UX Design Guidelines

### Color Palette
- **Primary**: #2563EB (Blue - trust, health)
- **Success**: #22C55E (Green - good coverage)
- **Warning**: #F59E0B (Orange - attention needed)
- **Danger**: #EF4444 (Red - critical)
- **Neutral**: #64748B (Gray - secondary text)

### Layout
- Responsive design (mobile-first for field use)
- Sidebar navigation (collapsible)
- Breadcrumb navigation for hierarchy
- Card-based dashboard widgets
- Data tables with sorting/filtering/pagination

### Key Screens
1. **Login** - Simple, secure, supports multiple languages
2. **Dashboard** - Overview with key metrics and map
3. **Campaign List** - Filterable table with status badges
4. **Campaign Detail** - Tabs for info, agents, data, reports
5. **Agent List** - Searchable table with performance indicators
6. **Daily Entry Form** - Mobile-optimized for field use
7. **Report Builder** - Drag-drop interface for custom reports
8. **Settings** - User management, system configuration

---

## Non-Functional Requirements

### Performance
- Dashboard loads in <3 seconds
- Map renders 10,000+ villages without lag
- Supports 1,000 concurrent users
- Offline capability for data entry

### Security
- Role-based access control (RBAC)
- JWT authentication
- HTTPS encryption
- Audit logging for all changes
- Data backup every 6 hours

### Scalability
- Multi-tenant architecture (multiple countries)
- Horizontal scaling for API servers
- CDN for static assets
- Database read replicas

### Localization
- Multi-language support (French, English, Portuguese)
- Timezone handling per country
- Number/date formatting per locale

---

## Implementation Phases

### Phase 1: Core Foundation (Weeks 1-4)
- Authentication & authorization
- Geographic hierarchy CRUD
- Basic campaign management
- Agent registration

### Phase 2: Data Collection (Weeks 5-8)
- Daily reporting forms
- Attendance tracking
- Supervisor verification
- Basic dashboard

### Phase 3: Visualization (Weeks 9-12)
- Interactive maps
- Charts and graphs
- Real-time updates
- Alert system

### Phase 4: Reporting (Weeks 13-16)
- Standard reports
- Custom report builder
- PDF/Excel export
- Email scheduling

### Phase 5: Enhancement (Weeks 17-20)
- Mobile app (React Native)
- Offline sync
- WhatsApp integration
- Advanced analytics

---

## Success Metrics

- **Coverage visibility**: Real-time data within 24 hours vs. 7+ days before
- **Data quality**: <5% data entry errors
- **User adoption**: 90% of agents using system daily
- **Response time**: Alerts addressed within 4 hours
- **Reporting efficiency**: Reports generated in minutes vs. days

---

*This specification provides a complete blueprint for building the Health Campaign Manager platform.*
