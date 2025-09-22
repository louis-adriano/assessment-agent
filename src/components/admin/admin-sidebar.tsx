'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface AdminSidebarProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: UserRole
  }
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  description?: string
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN],
    description: 'Overview and metrics'
  },
  {
    title: 'Courses',
    href: '/admin/courses',
    icon: GraduationCap,
    roles: [UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN],
    description: 'Manage courses and content'
  },
  {
    title: 'Questions',
    href: '/admin/questions',
    icon: BookOpen,
    roles: [UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN],
    description: 'Question and base examples'
  },
  {
    title: 'Submissions',
    href: '/admin/submissions',
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN],
    description: 'Student submissions'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.SUPER_ADMIN],
    description: 'User management'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: [UserRole.SUPER_ADMIN],
    description: 'Performance analytics'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN],
    description: 'System configuration'
  },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user.role)
  )

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800 border-red-200'
      case UserRole.COURSE_ADMIN:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin'
      case UserRole.COURSE_ADMIN:
        return 'Course Admin'
      default:
        return 'User'
    }
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200/60 shadow-sm">
      {/* Logo and user info */}
      <div className="flex flex-col p-6 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl opacity-50 blur-sm -z-10"></div>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg">Assessment Agent</div>
            <div className="text-xs text-gray-500">Admin Dashboard</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {user.name || 'Admin User'}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {user.email}
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs font-medium shadow-sm", getRoleBadgeColor(user.role))}
          >
            <UserCheck className="w-3 h-3 mr-1" />
            {getRoleDisplayName(user.role)}
          </Badge>
        </div>
      </div>

      <Separator className="border-gray-200/80" />

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
            Navigation
          </div>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between group h-auto p-3 transition-all duration-200 hover:shadow-sm",
                    isActive
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50 shadow-sm"
                      : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50/30 hover:translate-x-1"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.description && (
                        <span className={cn(
                          "text-xs transition-colors",
                          isActive ? "text-indigo-600/70" : "text-gray-500 group-hover:text-indigo-600/70"
                        )}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-200",
                    isActive
                      ? "text-indigo-600 rotate-90"
                      : "text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1"
                  )} />
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm">
        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg p-3 text-center">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Assessment Agent
          </div>
          <div className="text-xs text-gray-500">
            v1.0 • Admin Portal
          </div>
        </div>
      </div>
    </div>
  )
}