'use client'

import { UserRole } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Activity,
  Calendar,
  Target,
  Award,
  BarChart3,
  PlusCircle,
  Eye,
  Edit,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface AdminDashboardProps {
  user: {
    id: string
    name?: string | null
    email: string
    role: UserRole
  }
  data: {
    totalUsers: number | null
    totalCourses: number
    totalQuestions: number
    totalSubmissions: number
    recentSubmissions: Array<{
      id: string
      status: string
      createdAt: Date
      user: {
        name: string | null
        email: string
      }
      question: {
        title: string
        course: {
          name: string
        }
      }
    }>
    courseStats: Array<{
      id: string
      name: string
      _count: {
        questions: number
        enrollments: number
      }
    }>
  }
}

export function AdminDashboard({ user, data }: AdminDashboardProps) {
  const stats = [
    ...(user.role === UserRole.SUPER_ADMIN ? [{
      title: 'Total Users',
      value: data.totalUsers?.toString() || '0',
      description: 'Registered users',
      icon: Users,
      href: '/admin/users',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true
    }] : []),
    {
      title: 'Active Courses',
      value: data.totalCourses.toString(),
      description: user.role === UserRole.SUPER_ADMIN ? 'All courses' : 'Your courses',
      icon: GraduationCap,
      href: '/admin/courses',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Questions',
      value: data.totalQuestions.toString(),
      description: user.role === UserRole.SUPER_ADMIN ? 'All questions' : 'Your questions',
      icon: BookOpen,
      href: '/admin/questions',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Submissions',
      value: data.totalSubmissions.toString(),
      description: 'Student submissions',
      icon: FileText,
      href: '/admin/submissions',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      trend: '+23%',
      trendUp: true
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <Activity className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user.name || 'Admin'}! 👋
            </h1>
            <p className="text-indigo-100 mb-4">
              Here's what's happening with your assessment platform today.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <div className={`absolute inset-0 ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                  <Badge variant="outline" className={`text-xs ${stat.trendUp ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                    {stat.trend}
                  </Badge>
                </div>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">
                {stat.description}
              </p>
              <Link href={stat.href}>
                <Button variant="ghost" size="sm" className="w-full justify-between group-hover:bg-gray-50">
                  <span>View details</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest submissions and updates</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <FileText className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-gray-900">
                            {submission.question.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            in {submission.question.course.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>by {submission.user.name || submission.user.email}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(submission.status)}
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No recent activity</h3>
                  <p className="text-sm text-gray-500">Submissions will appear here as they come in</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Course Overview</CardTitle>
                  <CardDescription>Performance at a glance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.courseStats.length > 0 ? (
                <div className="space-y-4">
                  {data.courseStats.slice(0, 4).map((course) => (
                    <div key={course.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="font-medium text-sm text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {course.name}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {course._count.enrollments} students
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Questions: {course._count.questions}</span>
                          <span>{Math.min(100, (course._count.questions / 10) * 100)}% complete</span>
                        </div>
                        <Progress
                          value={Math.min(100, (course._count.questions / 10) * 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}

                  {data.courseStats.length > 4 && (
                    <Link href="/admin/courses">
                      <Button variant="ghost" className="w-full text-sm">
                        View All Courses
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No courses yet</h3>
                  <p className="text-xs text-gray-500 mb-3">Create your first course to get started</p>
                  <Link href="/admin/courses/new">
                    <Button size="sm" className="w-full">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Course
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/courses/new">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-200 group">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium">New Course</span>
              </Button>
            </Link>

            <Link href="/admin/questions/new">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200 group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Add Question</span>
              </Button>
            </Link>

            {user.role === UserRole.SUPER_ADMIN && (
              <Link href="/admin/users/new">
                <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 group">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Add User</span>
                </Button>
              </Link>
            )}

            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200 group">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}