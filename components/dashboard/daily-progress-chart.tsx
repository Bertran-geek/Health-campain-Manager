'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DailyProgressChartProps {
  data: {
    date: string
    reached: number
    target: number
  }[]
}

export function DailyProgressChart({ data }: DailyProgressChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    percentage: ((item.reached / item.target) * 100).toFixed(1),
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Daily Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorReached" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.75 0.15 180)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.75 0.15 180)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.8 0.16 85)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.8 0.16 85)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="oklch(0.28 0.005 260)" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                axisLine={{ stroke: 'oklch(0.28 0.005 260)' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'oklch(0.65 0 0)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.18 0.005 260)',
                  border: '1px solid oklch(0.28 0.005 260)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0 0)',
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'reached' ? 'Reached' : 'Target'
                ]}
                labelStyle={{ color: 'oklch(0.65 0 0)' }}
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="oklch(0.8 0.16 85)"
                strokeWidth={2}
                fill="url(#colorTarget)"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="reached"
                stroke="oklch(0.75 0.15 180)"
                strokeWidth={2}
                fill="url(#colorReached)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Reached</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Target</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
