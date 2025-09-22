'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { UserUserRole, SubmissionType } from '@prisma/client'

const createQuestionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  submissionType: z.nativeEnum(SubmissionType),
  criteria: z.string().optional(),
  courseId: z.string(),
})

const createBaseExampleSchema = z.object({
  questionId: z.string(),
  content: z.string().min(1, 'Content is required'),
  type: z.nativeEnum(SubmissionType),
  fileUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

const updateQuestionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().min(1, 'Description is required').optional(),
  submissionType: z.nativeEnum(SubmissionType).optional(),
  criteria: z.string().optional(),
  isActive: z.boolean().optional(),
})

const updateBaseExampleSchema = z.object({
  id: z.string(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.nativeEnum(SubmissionType).optional(),
  fileUrl: z.string().url().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export async function createQuestion(data: z.infer<typeof createQuestionSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = createQuestionSchema.parse(data)

    // Check if user has permission to create questions for this course
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      select: { adminId: true }
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // SUPER_ADMIN can create questions for any course, COURSE_ADMIN only for their courses
    if (user.role === UserRole.COURSE_ADMIN && course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const question = await prisma.question.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        submissionType: validatedData.submissionType,
        criteria: validatedData.criteria,
        courseId: validatedData.courseId,
        createdById: user.id,
      },
      include: {
        course: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        baseExample: true,
        _count: {
          select: { submissions: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${validatedData.courseId}`)
    revalidatePath(`/admin/courses/${validatedData.courseId}/questions`)
    return { success: true, data: question }
  } catch (error) {
    console.error('Create question error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create question' 
    }
  }
}

export async function updateQuestion(data: z.infer<typeof updateQuestionSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = updateQuestionSchema.parse(data)

    // Check if user has permission to update this question
    const existingQuestion = await prisma.question.findUnique({
      where: { id: validatedData.id },
      include: {
        course: {
          select: { adminId: true }
        }
      }
    })

    if (!existingQuestion) {
      return { success: false, error: 'Question not found' }
    }

    // SUPER_ADMIN can update any question, COURSE_ADMIN only their course questions
    if (user.role === UserRole.COURSE_ADMIN && existingQuestion.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const { id, ...updateData } = validatedData

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        baseExample: true,
        _count: {
          select: { submissions: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${question.courseId}`)
    revalidatePath(`/admin/courses/${question.courseId}/questions`)
    revalidatePath(`/admin/questions/${id}`)
    return { success: true, data: question }
  } catch (error) {
    console.error('Update question error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update question' 
    }
  }
}

export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    // Check if user has permission to delete this question
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { adminId: true, id: true }
        }
      }
    })

    if (!existingQuestion) {
      return { success: false, error: 'Question not found' }
    }

    // SUPER_ADMIN can delete any question, COURSE_ADMIN only their course questions
    if (user.role === UserRole.COURSE_ADMIN && existingQuestion.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    revalidatePath(`/admin/courses/${existingQuestion.course.id}`)
    revalidatePath(`/admin/courses/${existingQuestion.course.id}/questions`)
    return { success: true, data: { id: questionId, title: existingQuestion.title } }
  } catch (error) {
    console.error('Delete question error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete question' 
    }
  }
}

export async function getQuestions(courseId?: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    let whereClause: any = {}

    if (courseId) {
      // Check if user has access to this specific course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { 
          adminId: true,
          enrollments: {
            where: { studentId: user.id },
            select: { id: true }
          }
        }
      })

      if (!course) {
        return { success: false, error: 'Course not found' }
      }

      const hasAccess = 
        user.role === UserRole.SUPER_ADMIN ||
        (user.role === UserRole.COURSE_ADMIN && course.adminId === user.id) ||
        (user.role === UserRole.STUDENT && course.enrollments.length > 0)

      if (!hasAccess) {
        return { success: false, error: 'Insufficient permissions' }
      }

      whereClause.courseId = courseId
    } else {
      // UserRole-based filtering for all questions
      if (user.role === UserRole.STUDENT) {
        whereClause.course = {
          enrollments: {
            some: {
              studentId: user.id
            }
          }
        }
      } else if (user.role === UserRole.COURSE_ADMIN) {
        whereClause.course = {
          adminId: user.id
        }
      }
      // SUPER_ADMIN sees all questions (no filter)
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        course: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        baseExample: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: questions }
  } catch (error) {
    console.error('Get questions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch questions' 
    }
  }
}

export async function getQuestion(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { 
            id: true, 
            title: true, 
            adminId: true,
            enrollments: {
              where: { studentId: user.id },
              select: { id: true }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        baseExample: true,
        submissions: {
          where: user.role === UserRole.STUDENT ? { studentId: user.id } : {},
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Permission check
    const hasAccess = 
      user.role === UserRole.SUPER_ADMIN ||
      (user.role === UserRole.COURSE_ADMIN && question.course.adminId === user.id) ||
      (user.role === UserRole.STUDENT && question.course.enrollments.length > 0)

    if (!hasAccess) {
      return { success: false, error: 'Insufficient permissions' }
    }

    return { success: true, data: question }
  } catch (error) {
    console.error('Get question error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch question' 
    }
  }
}

export async function createBaseExample(data: z.infer<typeof createBaseExampleSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = createBaseExampleSchema.parse(data)

    // Check if user has permission to create base example for this question
    const question = await prisma.question.findUnique({
      where: { id: validatedData.questionId },
      include: {
        course: {
          select: { adminId: true, id: true }
        },
        baseExample: {
          select: { id: true }
        }
      }
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // SUPER_ADMIN can create base examples for any question, COURSE_ADMIN only for their course questions
    if (user.role === UserRole.COURSE_ADMIN && question.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Check if base example already exists
    if (question.baseExample) {
      return { success: false, error: 'Base example already exists for this question' }
    }

    const baseExample = await prisma.baseExample.create({
      data: {
        content: validatedData.content,
        type: validatedData.type,
        fileUrl: validatedData.fileUrl,
        metadata: validatedData.metadata,
        questionId: validatedData.questionId,
      },
      include: {
        question: {
          select: { id: true, title: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${question.course.id}`)
    revalidatePath(`/admin/questions/${validatedData.questionId}`)
    return { success: true, data: baseExample }
  } catch (error) {
    console.error('Create base example error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create base example' 
    }
  }
}

export async function updateBaseExample(data: z.infer<typeof updateBaseExampleSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin()
    const validatedData = updateBaseExampleSchema.parse(data)

    // Check if user has permission to update this base example
    const existingBaseExample = await prisma.baseExample.findUnique({
      where: { id: validatedData.id },
      include: {
        question: {
          include: {
            course: {
              select: { adminId: true, id: true }
            }
          }
        }
      }
    })

    if (!existingBaseExample) {
      return { success: false, error: 'Base example not found' }
    }

    // SUPER_ADMIN can update any base example, COURSE_ADMIN only their course base examples
    if (user.role === UserRole.COURSE_ADMIN && existingBaseExample.question.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const { id, ...updateData } = validatedData

    const baseExample = await prisma.baseExample.update({
      where: { id },
      data: updateData,
      include: {
        question: {
          select: { id: true, title: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${existingBaseExample.question.course.id}`)
    revalidatePath(`/admin/questions/${existingBaseExample.questionId}`)
    return { success: true, data: baseExample }
  } catch (error) {
    console.error('Update base example error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update base example' 
    }
  }
}

export async function deleteBaseExample(baseExampleId: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    // Check if user has permission to delete this base example
    const existingBaseExample = await prisma.baseExample.findUnique({
      where: { id: baseExampleId },
      include: {
        question: {
          include: {
            course: {
              select: { adminId: true, id: true }
            }
          }
        }
      }
    })

    if (!existingBaseExample) {
      return { success: false, error: 'Base example not found' }
    }

    // SUPER_ADMIN can delete any base example, COURSE_ADMIN only their course base examples
    if (user.role === UserRole.COURSE_ADMIN && existingBaseExample.question.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await prisma.baseExample.delete({
      where: { id: baseExampleId }
    })

    revalidatePath(`/admin/courses/${existingBaseExample.question.course.id}`)
    revalidatePath(`/admin/questions/${existingBaseExample.questionId}`)
    return { success: true, data: { id: baseExampleId } }
  } catch (error) {
    console.error('Delete base example error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete base example' 
    }
  }
}