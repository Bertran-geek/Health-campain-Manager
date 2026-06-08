'use client'

import { Bell, Search, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Swal from 'sweetalert2'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface AppHeaderProps {
  title?: string
}

export function AppHeader({ title = 'Dashboard' }: AppHeaderProps) {
  const router = useRouter()
  const locale = useLocale()

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: locale === 'fr' ? 'Déconnexion' : 'Sign out',
      text: locale === 'fr'
        ? 'Voulez-vous vraiment vous déconnecter ?'
        : 'Are you sure you want to sign out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5C8BB0',
      cancelButtonColor: '#6b7280',
      confirmButtonText: locale === 'fr' ? 'Oui, déconnecter' : 'Yes, sign out',
      cancelButtonText: locale === 'fr' ? 'Annuler' : 'Cancel',
      background: 'rgba(15, 35, 55, 0.97)',
      color: '#ffffff',
    })

    if (result.isConfirmed) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.clear()

      await Swal.fire({
        icon: 'success',
        title: locale === 'fr' ? 'Déconnecté !' : 'Signed out!',
        text: locale === 'fr' ? 'À bientôt.' : 'See you soon.',
        timer: 1200,
        showConfirmButton: false,
        background: 'rgba(15, 35, 55, 0.97)',
        color: '#ffffff',
        iconColor: '#70E095',
      })

      router.push(`/${locale === 'en' ? '' : locale}`)
    }
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns, agents..."
            className="w-64 pl-9 bg-muted border-transparent focus:border-primary"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
            4
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">Administrateur</span>
                <span className="text-xs text-muted-foreground">Super Admin</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{locale === 'fr' ? 'Mon compte' : 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{locale === 'fr' ? 'Profil' : 'Profile'}</DropdownMenuItem>
            <DropdownMenuItem>{locale === 'fr' ? 'Paramètres' : 'Settings'}</DropdownMenuItem>
            <DropdownMenuItem>{locale === 'fr' ? 'Aide' : 'Help & Support'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {locale === 'fr' ? 'Se déconnecter' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
