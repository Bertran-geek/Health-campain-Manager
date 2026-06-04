'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { CoverageStats } from '@/lib/types'

interface CoverageCardProps {
  coverage: CoverageStats
}

export function CoverageCard({ coverage }: CoverageCardProps) {
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-success'
    if (percentage >= 70) return 'bg-primary'
    if (percentage >= 50) return 'bg-warning'
    return 'bg-destructive'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Coverage Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Coverage */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Coverage</span>
            <span className="text-3xl font-bold text-foreground">{coverage.coveragePercentage.toFixed(1)}%</span>
          </div>
          <Progress
            value={coverage.coveragePercentage}
            className="h-3"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{coverage.totalReached.toLocaleString()} reached</span>
            <span>{coverage.targetPopulation.toLocaleString()} target</span>
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Male</div>
            <div className="text-lg font-semibold text-foreground">
              {coverage.maleReached.toLocaleString()}
            </div>
            <div className="text-xs text-primary">
              {((coverage.maleReached / coverage.totalReached) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Female</div>
            <div className="text-lg font-semibold text-foreground">
              {coverage.femaleReached.toLocaleString()}
            </div>
            <div className="text-xs text-accent">
              {((coverage.femaleReached / coverage.totalReached) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Age Group Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">By Age Group</h4>
          <div className="space-y-3">
            {coverage.byAgeGroup.map((group, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{group.label}</span>
                  <span className="text-foreground font-medium">{group.percentage.toFixed(1)}%</span>
                </div>
                <Progress
                  value={group.percentage}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{group.reached.toLocaleString()}</span>
                  <span>{group.target.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
