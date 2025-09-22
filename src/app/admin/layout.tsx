import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // For Sprint 3 demo, we'll use a mock user to test the interface
  // Comment out auth checks temporarily for testing

  // const user = await getCurrentUser()
  // if (!user) {
  //   redirect('/auth/signin')
  // }
  // if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.COURSE_ADMIN) {
  //   redirect('/unauthorized')
  // }

  // Mock user for testing the interface
  const user = {
    id: 'test-super-admin-id',
    name: 'Test Super Admin',
    email: 'superadmin@assessment.local',
    role: UserRole.SUPER_ADMIN
  }

  return (
    <div className="flex h-screen bg-gray-50/30">
      {/* Mobile Sidebar Overlay */}
      <div className="md:hidden fixed inset-0 z-50 hidden" id="mobile-sidebar-overlay">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative w-64 h-full">
          <AdminSidebar user={user} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        <AdminSidebar user={user} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-64">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}