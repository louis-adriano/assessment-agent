'use client'

import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface AdminHeaderProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: UserRole
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800'
      case UserRole.COURSE_ADMIN:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleMobileSidebar = () => {
    const overlay = document.getElementById('mobile-sidebar-overlay')
    if (overlay) {
      overlay.classList.toggle('hidden')
    }
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </Button>
        </div>

        {/* Page title area - can be customized per page */}
        <div className="flex-1 flex items-center">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 ml-3 md:ml-0 truncate">
            Admin Dashboard
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 sm:h-10 w-auto px-2 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-gray-200">
                    <AvatarImage src="" alt={user.name || user.email} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-medium">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex lg:flex-col lg:items-start">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-24">
                      {user.name || 'Admin User'}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || 'Admin User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}