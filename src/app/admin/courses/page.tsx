import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { CoursesTable } from '@/components/admin/courses-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getCourses(userRole: UserRole, userId: string) {
  return await prisma.course.findMany({
    where: userRole === UserRole.SUPER_ADMIN ? {} : { createdBy: userId },
    include: {
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          questions: true,
          enrollments: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export default async function CoursesPage() {
  // Mock user for testing
  const user = {
    id: 'test-super-admin-id',
    name: 'Test Super Admin',
    email: 'superadmin@assessment.local',
    role: UserRole.SUPER_ADMIN
  }
  const courses = await getCourses(user.role, user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">
            {user.role === UserRole.SUPER_ADMIN ? 'Manage all courses' : 'Manage your courses'}
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Enhanced Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{courses.length}</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                +2 this month
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {courses.reduce((sum, course) => sum + course._count.questions, 0)}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                Across all courses
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                Active students
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Courses Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">All Courses</CardTitle>
                <CardDescription>
                  Manage course settings, questions, and enrollments
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                {courses.length} total
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CoursesTable courses={courses} currentUser={user} />
        </CardContent>
      </Card>
    </div>
  )
}