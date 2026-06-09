'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Globe,
  Megaphone,
  Users,
  ClipboardList,
  Map,
  Bell,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  FlaskConical,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_HREFS = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'hierarchy', href: '/dashboard/hierarchy', icon: Globe },
  { key: 'campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { key: 'molecules', href: '/dashboard/molecules', icon: FlaskConical },
  { key: 'users', href: '/dashboard/agents', icon: Users },
  { key: 'dataCollection', href: '/dashboard/data-collection', icon: ClipboardList },
  { key: 'coverageMap', href: '/dashboard/map', icon: Map },
  { key: 'alerts', href: '/dashboard/alerts', icon: Bell },
  { key: 'reports', href: '/dashboard/reports', icon: FileText },
]

const BOTTOM_HREFS = [
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const t = useTranslations('Sidebar')

  const navigationItems = NAV_HREFS.map(item => ({ ...item, name: t(item.key as any) }))
  const bottomNavigationItems = BOTTOM_HREFS.map(item => ({ ...item, name: t(item.key as any) }))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HealthCM</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.name}>{linkContent}</div>
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border py-4 px-2">
          {bottomNavigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.name}>{linkContent}</div>
          })}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full mt-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('collapse')}
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
