'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Role, SubmissionType, SubmissionStatus } from '@prisma/client'
import { processSubmission } from '@/lib/services/assessment-service'

const createSubmissionSchema = z.object({
  questionId: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
})

const updateSubmissionSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export async function createSubmission(data: z.infer<typeof createSubmissionSchema>): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const validatedData = createSubmissionSchema.parse(data)

    // Only students can create submissions
    if (user.role !== Role.STUDENT) {
      return { success: false, error: 'Only students can create submissions' }
    }

    // Check if user has access to this question (is enrolled in the course)
    const question = await prisma.question.findUnique({
      where: { id: validatedData.questionId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId: user.id },
              select: { id: true }
            }
          }
        },
        baseExample: true
      }
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    if (question.course.enrollments.length === 0) {
      return { success: false, error: 'You must be enrolled in this course to submit' }
    }

    if (!question.isActive) {
      return { success: false, error: 'This question is no longer accepting submissions' }
    }

    // Validate submission content based on submission type
    const submissionContent = getSubmissionContent(question.submissionType, validatedData)
    if (!submissionContent) {
      return { success: false, error: `${question.submissionType.toLowerCase()} content is required` }
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        questionId: validatedData.questionId,
        studentId: user.id,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl,
        websiteUrl: validatedData.websiteUrl,
        githubUrl: validatedData.githubUrl,
        status: SubmissionStatus.PENDING,
      },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, title: true }
            },
            baseExample: true
          }
        },
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Process the submission asynchronously using the assessment service
    processSubmission(submission.id).catch(error => {
      console.error(`Background processing failed for submission ${submission.id}:`, error)
    })

    revalidatePath(`/courses/${question.course.id}`)
    revalidatePath(`/questions/${validatedData.questionId}`)
    revalidatePath('/submissions')

    return { success: true, data: submission }
  } catch (error) {
    console.error('Create submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create submission'
    }
  }
}

export async function updateSubmission(data: z.infer<typeof updateSubmissionSchema>): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const validatedData = updateSubmissionSchema.parse(data)

    // Check if user owns this submission
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: validatedData.id },
      include: {
        question: {
          include: {
            course: true,
            baseExample: true
          }
        }
      }
    })

    if (!existingSubmission) {
      return { success: false, error: 'Submission not found' }
    }

    if (existingSubmission.studentId !== user.id) {
      return { success: false, error: 'You can only update your own submissions' }
    }

    if (existingSubmission.status === SubmissionStatus.PROCESSING) {
      return { success: false, error: 'Cannot update submission while it is being processed' }
    }

    const { id, ...updateData } = validatedData

    // Validate new content if provided
    const newContent = getSubmissionContent(existingSubmission.question.submissionType, updateData)
    if (newContent && newContent !== getSubmissionContent(existingSubmission.question.submissionType, existingSubmission)) {
      // Content changed, reset assessment
      updateData.status = SubmissionStatus.PENDING
      updateData.score = null
      updateData.feedback = null
      updateData.confidence = null
      updateData.comparisonData = null
      updateData.processedAt = null
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData as any,
      include: {
        question: {
          include: {
            course: {
              select: { id: true, title: true }
            },
            baseExample: true
          }
        },
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Re-process if content changed
    if (newContent && submission.status === SubmissionStatus.PENDING) {
      processSubmission(submission.id).catch(error => {
        console.error(`Background reprocessing failed for submission ${submission.id}:`, error)
      })
    }

    revalidatePath(`/courses/${submission.question.course.id}`)
    revalidatePath(`/questions/${submission.questionId}`)
    revalidatePath(`/submissions/${id}`)

    return { success: true, data: submission }
  } catch (error) {
    console.error('Update submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update submission'
    }
  }
}

export async function deleteSubmission(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Check if user owns this submission or is an admin
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: {
              select: { id: true, adminId: true }
            }
          }
        }
      }
    })

    if (!existingSubmission) {
      return { success: false, error: 'Submission not found' }
    }

    const canDelete =
      existingSubmission.studentId === user.id ||
      user.role === Role.SUPER_ADMIN ||
      (user.role === Role.COURSE_ADMIN && existingSubmission.question.course.adminId === user.id)

    if (!canDelete) {
      return { success: false, error: 'Insufficient permissions' }
    }

    await prisma.submission.delete({
      where: { id: submissionId }
    })

    revalidatePath(`/courses/${existingSubmission.question.course.id}`)
    revalidatePath(`/questions/${existingSubmission.questionId}`)
    revalidatePath('/submissions')

    return { success: true, data: { id: submissionId } }
  } catch (error) {
    console.error('Delete submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete submission'
    }
  }
}

export async function getSubmissions(questionId?: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    let whereClause: any = {}

    if (questionId) {
      // Check if user has access to this question's submissions
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          course: {
            select: {
              adminId: true,
              enrollments: {
                where: { studentId: user.id },
                select: { id: true }
              }
            }
          }
        }
      })

      if (!question) {
        return { success: false, error: 'Question not found' }
      }

      const hasAccess =
        user.role === Role.SUPER_ADMIN ||
        (user.role === Role.COURSE_ADMIN && question.course.adminId === user.id) ||
        (user.role === Role.STUDENT && question.course.enrollments.length > 0)

      if (!hasAccess) {
        return { success: false, error: 'Insufficient permissions' }
      }

      whereClause.questionId = questionId
    }

    // Role-based filtering
    if (user.role === Role.STUDENT) {
      whereClause.studentId = user.id
    } else if (user.role === Role.COURSE_ADMIN) {
      whereClause.question = {
        course: {
          adminId: user.id
        }
      }
    }
    // SUPER_ADMIN sees all submissions (no additional filter)

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        question: {
          include: {
            course: {
              select: { id: true, title: true }
            }
          }
        },
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    return { success: true, data: submissions }
  } catch (error) {
    console.error('Get submissions error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submissions'
    }
  }
}

export async function getSubmission(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
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
            baseExample: true
          }
        },
        student: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Permission check
    const hasAccess =
      submission.studentId === user.id ||
      user.role === Role.SUPER_ADMIN ||
      (user.role === Role.COURSE_ADMIN && submission.question.course.adminId === user.id)

    if (!hasAccess) {
      return { success: false, error: 'Insufficient permissions' }
    }

    return { success: true, data: submission }
  } catch (error) {
    console.error('Get submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submission'
    }
  }
}

export async function reprocessSubmission(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Only admins can reprocess submissions
    if (user.role === Role.STUDENT) {
      return { success: false, error: 'Only admins can reprocess submissions' }
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: {
              select: { adminId: true }
            },
            baseExample: true
          }
        }
      }
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // COURSE_ADMIN can only reprocess submissions in their courses
    if (user.role === Role.COURSE_ADMIN && submission.question.course.adminId !== user.id) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const submissionContent = getSubmissionContent(submission.question.submissionType, submission)
    if (!submissionContent) {
      return { success: false, error: 'No content to process' }
    }

    // Reset submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.PENDING,
        score: null,
        feedback: null,
        confidence: null,
        comparisonData: null,
        processedAt: null,
      }
    })

    // Reprocess using assessment service
    processSubmission(submissionId).catch(error => {
      console.error(`Manual reprocessing failed for submission ${submissionId}:`, error)
    })

    revalidatePath(`/submissions/${submissionId}`)
    revalidatePath(`/questions/${submission.questionId}`)

    return { success: true, data: { message: 'Reprocessing started' } }
  } catch (error) {
    console.error('Reprocess submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reprocess submission'
    }
  }
}

// Helper functions
function getSubmissionContent(submissionType: SubmissionType, data: any): string | null {
  switch (submissionType) {
    case SubmissionType.TEXT:
      return data.content || null
    case SubmissionType.WEBSITE:
      return data.websiteUrl || null
    case SubmissionType.GITHUB_REPO:
      return data.githubUrl || null
    case SubmissionType.DOCUMENT:
      return data.fileUrl || null
    default:
      return null
  }
}

