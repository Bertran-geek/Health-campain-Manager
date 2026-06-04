'use client'

import { useState } from 'react'
import {
  Layers,
  MapPin,
  Target,
  Users,
  Activity,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { mockRegions, mockDistricts, mockHealthAreas, mockVillages, mockCampaigns, mockCampaignSummary } from '@/lib/mock-data'

// Simulated coverage data by region
const regionCoverage = [
  { id: 'kin', name: 'Kinshasa', coverage: 78.5, reached: 1178500, target: 1500000 },
  { id: 'hka', name: 'Haut-Katanga', coverage: 65.2, reached: 338000, target: 520000 },
  { id: 'nki', name: 'Nord-Kivu', coverage: 52.8, reached: 343200, target: 650000 },
  { id: 'ski', name: 'Sud-Kivu', coverage: 71.4, reached: 414120, target: 580000 },
  { id: 'equ', name: 'Equateur', coverage: 45.6, reached: 186960, target: 410000 },
]

const coverageLegend = [
  { label: 'Excellent (90%+)', color: 'bg-success', min: 90 },
  { label: 'Good (70-89%)', color: 'bg-primary', min: 70 },
  { label: 'Fair (50-69%)', color: 'bg-warning', min: 50 },
  { label: 'Poor (<50%)', color: 'bg-destructive', min: 0 },
]

function getCoverageColor(percentage: number): string {
  if (percentage >= 90) return 'bg-success'
  if (percentage >= 70) return 'bg-primary'
  if (percentage >= 50) return 'bg-warning'
  return 'bg-destructive'
}

function getCoverageTextColor(percentage: number): string {
  if (percentage >= 90) return 'text-success'
  if (percentage >= 70) return 'text-primary'
  if (percentage >= 50) return 'text-warning'
  return 'text-destructive'
}

export default function MapPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [mapLayer, setMapLayer] = useState<'coverage' | 'teams' | 'alerts'>('coverage')
  const [zoomLevel, setZoomLevel] = useState(1)

  const selectedRegionData = selectedRegion 
    ? regionCoverage.find(r => r.id === selectedRegion) 
    : null

  const districtsInRegion = selectedRegion 
    ? mockDistricts.filter(d => d.regionId === selectedRegion)
    : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Coverage Map</h2>
          <p className="text-muted-foreground">
            Real-time geographic visualization of campaign progress
          </p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="camp1">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {mockCampaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name.split(' - ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Layer:</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-none px-3',
                mapLayer === 'coverage' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setMapLayer('coverage')}
            >
              <Target className="h-4 w-4 mr-1" />
              Coverage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-none px-3 border-l border-border',
                mapLayer === 'teams' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setMapLayer('teams')}
            >
              <Users className="h-4 w-4 mr-1" />
              Teams
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-none px-3 border-l border-border',
                mapLayer === 'alerts' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setMapLayer('alerts')}
            >
              <Activity className="h-4 w-4 mr-1" />
              Alerts
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.5))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div 
              className="relative bg-muted/30 rounded-lg overflow-hidden"
              style={{ height: '500px' }}
            >
              {/* Map Placeholder with Interactive Regions */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <div className="relative w-full max-w-2xl aspect-[4/3]">
                  {/* Simplified DRC Map Representation */}
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Background */}
                    <rect width="400" height="300" fill="transparent" />
                    
                    {/* Regions as interactive areas */}
                    {regionCoverage.map((region, index) => {
                      const positions = [
                        { x: 200, y: 80, width: 80, height: 60 },  // Kinshasa
                        { x: 250, y: 180, width: 100, height: 70 }, // Haut-Katanga
                        { x: 300, y: 80, width: 70, height: 50 },   // Nord-Kivu
                        { x: 280, y: 140, width: 60, height: 50 },  // Sud-Kivu
                        { x: 120, y: 60, width: 90, height: 60 },   // Equateur
                      ]
                      const pos = positions[index]
                      const isSelected = selectedRegion === region.id
                      
                      return (
                        <g key={region.id}>
                          <rect
                            x={pos.x}
                            y={pos.y}
                            width={pos.width}
                            height={pos.height}
                            rx="4"
                            className={cn(
                              'cursor-pointer transition-all',
                              isSelected ? 'stroke-foreground stroke-2' : 'stroke-border',
                              getCoverageColor(region.coverage).replace('bg-', 'fill-') + '/60'
                            )}
                            style={{
                              fill: region.coverage >= 90 ? 'oklch(0.7 0.18 145 / 0.6)' :
                                    region.coverage >= 70 ? 'oklch(0.75 0.15 180 / 0.6)' :
                                    region.coverage >= 50 ? 'oklch(0.75 0.18 55 / 0.6)' :
                                    'oklch(0.55 0.22 25 / 0.6)'
                            }}
                            onClick={() => setSelectedRegion(region.id)}
                          />
                          <text
                            x={pos.x + pos.width / 2}
                            y={pos.y + pos.height / 2 - 8}
                            textAnchor="middle"
                            className="fill-foreground text-xs font-medium pointer-events-none"
                          >
                            {region.name}
                          </text>
                          <text
                            x={pos.x + pos.width / 2}
                            y={pos.y + pos.height / 2 + 8}
                            textAnchor="middle"
                            className="fill-foreground text-sm font-bold pointer-events-none"
                          >
                            {region.coverage.toFixed(0)}%
                          </text>
                        </g>
                      )
                    })}

                    {/* Village markers when zoomed in */}
                    {zoomLevel >= 1.2 && mockVillages.slice(0, 5).map((village, index) => (
                      <g key={village.id}>
                        <circle
                          cx={180 + index * 30}
                          cy={90 + (index % 2) * 20}
                          r="6"
                          className="fill-accent stroke-accent-foreground cursor-pointer"
                        />
                        <text
                          x={180 + index * 30}
                          y={90 + (index % 2) * 20 + 4}
                          textAnchor="middle"
                          className="fill-accent-foreground text-[8px] font-bold pointer-events-none"
                        >
                          {(index + 1) * 200}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-card/90 backdrop-blur border border-border">
                <h4 className="text-xs font-medium text-foreground mb-2">Coverage Legend</h4>
                <div className="space-y-1">
                  {coverageLegend.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded', item.color)} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Info */}
              <div className="absolute top-4 right-4 p-3 rounded-lg bg-card/90 backdrop-blur border border-border">
                <div className="text-xs text-muted-foreground">Click a region for details</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Overall Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall Coverage</span>
                  <span className="font-bold text-foreground">
                    {mockCampaignSummary.coverage.coveragePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={mockCampaignSummary.coverage.coveragePercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-bold text-foreground">
                    {(mockCampaignSummary.coverage.totalReached / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-muted-foreground">Reached</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-lg font-bold text-foreground">
                    {(mockCampaignSummary.coverage.targetPopulation / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-muted-foreground">Target</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Region Details */}
          {selectedRegionData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {selectedRegionData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className={cn('font-bold', getCoverageTextColor(selectedRegionData.coverage))}>
                      {selectedRegionData.coverage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={selectedRegionData.coverage} className="h-2" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reached</span>
                    <span className="text-foreground">{selectedRegionData.reached.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span className="text-foreground">{selectedRegionData.target.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Districts</span>
                    <span className="text-foreground">{districtsInRegion.length}</span>
                  </div>
                </div>

                {/* Districts in Region */}
                {districtsInRegion.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Districts</h4>
                    <div className="space-y-1">
                      {districtsInRegion.map(district => (
                        <div 
                          key={district.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                        >
                          <span className="text-foreground">{district.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {district.healthFacilitiesCount} facilities
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Region List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Regions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {regionCoverage.map((region) => (
                <div
                  key={region.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                    selectedRegion === region.id 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedRegion(region.id)}
                >
                  <span className="text-sm text-foreground">{region.name}</span>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getCoverageTextColor(region.coverage))}
                  >
                    {region.coverage.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
