import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

async function getDashboardData(userRole: UserRole, userId: string) {
  const [
    totalUsers,
    totalCourses,
    totalQuestions,
    totalSubmissions,
    recentSubmissions,
    courseStats,
  ] = await Promise.all([
    // Total users (Super Admin only)
    userRole === UserRole.SUPER_ADMIN
      ? prisma.user.count()
      : null,

    // Total courses (filtered by role)
    userRole === UserRole.SUPER_ADMIN
      ? prisma.course.count()
      : prisma.course.count({
          where: { createdBy: userId }
        }),

    // Total questions (filtered by role)
    userRole === UserRole.SUPER_ADMIN
      ? prisma.question.count()
      : prisma.question.count({
          where: {
            course: { createdBy: userId }
          }
        }),

    // Total submissions (filtered by role)
    userRole === UserRole.SUPER_ADMIN
      ? prisma.submission.count()
      : prisma.submission.count({
          where: {
            question: {
              course: { createdBy: userId }
            }
          }
        }),

    // Recent submissions (filtered by role)
    userRole === UserRole.SUPER_ADMIN
      ? prisma.submission.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true }
            },
            question: {
              select: {
                title: true,
                course: {
                  select: { name: true }
                }
              }
            }
          }
        })
      : prisma.submission.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: {
            question: {
              course: { createdBy: userId }
            }
          },
          include: {
            user: {
              select: { name: true, email: true }
            },
            question: {
              select: {
                title: true,
                course: {
                  select: { name: true }
                }
              }
            }
          }
        }),

    // Course statistics
    userRole === UserRole.SUPER_ADMIN
      ? prisma.course.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                questions: true,
                enrollments: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        })
      : prisma.course.findMany({
          where: { createdBy: userId },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                questions: true,
                enrollments: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        })
  ])

  return {
    totalUsers,
    totalCourses,
    totalQuestions,
    totalSubmissions,
    recentSubmissions,
    courseStats,
  }
}

export default async function AdminDashboardPage() {
  // Mock user for testing
  const user = {
    id: 'test-super-admin-id',
    name: 'Test Super Admin',
    email: 'superadmin@assessment.local',
    role: UserRole.SUPER_ADMIN
  }
  const dashboardData = await getDashboardData(user.role, user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your assessment system.
        </p>
      </div>

      <AdminDashboard
        user={user}
        data={dashboardData}
      />
    </div>
  )
}