'use client'

import { UserRole } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, Users, BookOpen, Calendar, Clock, CheckCircle, AlertCircle, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface Course {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  createdByUser: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    questions: number
    enrollments: number
  }
}

interface CoursesTableProps {
  courses: Course[]
  currentUser: {
    id: string
    role: UserRole
  }
}

export function CoursesTable({ courses, currentUser }: CoursesTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full"></div>
          <div className="relative flex items-center justify-center h-full">
            <BookOpen className="h-12 w-12 text-indigo-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No courses found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {currentUser.role === UserRole.SUPER_ADMIN
            ? 'No courses have been created yet. Get started by creating your first course.'
            : 'You haven\'t created any courses yet. Create your first course to get started.'
          }
        </p>
        <Link href="/admin/courses/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <BookOpen className="mr-2 h-4 w-4" />
            Create your first course
          </Button>
        </Link>
      </div>
    )
  }

  const canEdit = (course: Course) => {
    return currentUser.role === UserRole.SUPER_ADMIN || course.createdBy === currentUser.id
  }

  const canDelete = (course: Course) => {
    return currentUser.role === UserRole.SUPER_ADMIN || course.createdBy === currentUser.id
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {courses.map((course, index) => (
          <div
            key={course.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.5s ease-out both'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors block"
                  >
                    {course.name}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {canEdit(course) && (
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Course
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mb-3">
              <Badge
                variant="outline"
                className={
                  course.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }
              >
                {course.isActive ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <BookOpen className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{course._count.questions}</div>
                  <div className="text-xs text-gray-500">questions</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
                  <Users className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{course._count.enrollments}</div>
                  <div className="text-xs text-gray-500">students</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200">
            <TableHead className="font-semibold text-gray-700">Course</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Questions
              </div>
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Students
              </div>
            </TableHead>
            {currentUser.role === UserRole.SUPER_ADMIN && (
              <TableHead className="font-semibold text-gray-700">Created By</TableHead>
            )}
            <TableHead className="font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Updated
              </div>
            </TableHead>
            <TableHead className="w-[100px] font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course, index) => (
            <TableRow
              key={course.id}
              className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50/30 transition-all duration-200 border-b border-gray-100"
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 0.5s ease-out both'
              }}
              onMouseEnter={() => setHoveredRow(course.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <TableCell>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors block"
                    >
                      {course.name}
                    </Link>
                    <p className="text-sm text-gray-600 truncate max-w-xs">
                      {course.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    course.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }
                >
                  {course.isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course._count.questions}</div>
                    <div className="text-xs text-gray-500">questions</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{course._count.enrollments}</div>
                    <div className="text-xs text-gray-500">students</div>
                  </div>
                </div>
              </TableCell>
              {currentUser.role === UserRole.SUPER_ADMIN && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {course.createdByUser.name || 'Unknown'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {course.createdByUser.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-gray-500">last update</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/courses/${course.id}/questions`}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Manage Questions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/courses/${course.id}/enrollments`}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Students
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canEdit(course) && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Course
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canDelete(course) && (
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}