'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin, requireSuperAdmin } from '@/lib/auth'
import { UserRole } from '@prisma/client'

const createCourseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
})

const updateCourseSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  adminId: z.string().optional(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export async function createCourse(data: z.infer<typeof createCourseSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = createCourseSchema.parse(data)

    const course = await prisma.course.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        createdBy: user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    return { success: true, data: course }
  } catch (error) {
    console.error('Create course error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course'
    }
  }
}

export async function updateCourse(data: z.infer<typeof updateCourseSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = updateCourseSchema.parse(data)

    // Check if user has permission to update this course
    const existingCourse = await prisma.course.findUnique({
      where: { id: validatedData.id },
      select: { adminId: true }
    })

    if (!existingCourse) {
      return { success: false, error: 'Course not found' }
    }

    // SUPER_ADMIN can update any course, COURSE_ADMIN can only update their own
    if (user.role === UserRole.COURSE_ADMIN && existingCourse.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const { id, ...updateData } = validatedData
    
    // For COURSE_ADMIN, prevent changing adminId
    if (user.role === UserRole.COURSE_ADMIN) {
      delete (updateData as any).adminId
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${id}`)
    return { success: true, data: course }
  } catch (error) {
    console.error('Update course error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update course' 
    }
  }
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    // Check if user has permission to delete this course
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { adminId: true, title: true }
    })

    if (!existingCourse) {
      return { success: false, error: 'Course not found' }
    }

    // SUPER_ADMIN can delete any course, COURSE_ADMIN can only delete their own
    if (user.role === UserRole.COURSE_ADMIN && existingCourse.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await prisma.course.delete({
      where: { id: courseId }
    })

    revalidatePath('/admin/courses')
    return { success: true, data: { id: courseId, title: existingCourse.title } }
  } catch (error) {
    console.error('Delete course error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete course' 
    }
  }
}

export async function getCourses(): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    let whereClause = {}
    
    // UserRole-based filtering
    if (user.role === UserRole.STUDENT) {
      // Students only see courses they're enrolled in
      whereClause = {
        enrollments: {
          some: {
            studentId: user.id
          }
        }
      }
    } else if (user.role === UserRole.COURSE_ADMIN) {
      // Course admins only see their courses
      whereClause = {
        adminId: user.id
      }
    }
    // SUPER_ADMIN sees all courses (no filter)

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: courses }
  } catch (error) {
    console.error('Get courses error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch courses' 
    }
  }
}

export async function getCourse(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        questions: {
          include: {
            baseExample: true,
            _count: {
              select: { submissions: true }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { questions: true, enrollments: true }
        }
      }
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // Permission check
    const hasAccess = 
      user.role === UserRole.SUPER_ADMIN ||
      (user.role === UserRole.COURSE_ADMIN && course.adminId === user.id) ||
      (user.role === UserRole.STUDENT && course.enrollments.some(e => e.studentId === user.id))

    if (!hasAccess) {
      return { success: false, error: 'Insufficient permissions' }
    }

    return { success: true, data: course }
  } catch (error) {
    console.error('Get course error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch course' 
    }
  }
}

export async function enrollInCourse(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    if (user.role !== UserRole.STUDENT) {
      return { success: false, error: 'Only students can enroll in courses' }
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId, isActive: true }
    })

    if (!course) {
      return { success: false, error: 'Course not found or inactive' }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: user.id
        }
      }
    })

    if (existingEnrollment) {
      return { success: false, error: 'Already enrolled in this course' }
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId: user.id
      },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    return { success: true, data: enrollment }
  } catch (error) {
    console.error('Enroll in course error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to enroll in course' 
    }
  }
}