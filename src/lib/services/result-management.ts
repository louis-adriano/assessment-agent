'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { Role, SubmissionStatus } from '@prisma/client'

export interface AssessmentResultSummary {
  submissionId: string
  studentName: string
  questionTitle: string
  courseTitle: string
  score: number | null
  status: SubmissionStatus
  submittedAt: Date
  processedAt: Date | null
  confidence: number | null
  hasComparison: boolean
}

export interface DetailedAssessmentResult {
  submission: {
    id: string
    content: string | null
    fileUrl: string | null
    websiteUrl: string | null
    githubUrl: string | null
    status: SubmissionStatus
    submittedAt: Date
    processedAt: Date | null
  }
  student: {
    id: string
    name: string | null
    email: string
  }
  question: {
    id: string
    title: string
    description: string
    submissionType: string
    criteria: string | null
    baseExample: {
      id: string
      content: string
      type: string
      metadata: any
    } | null
  }
  course: {
    id: string
    title: string
  }
  assessment: {
    score: number | null
    feedback: string | null
    confidence: number | null
    comparisonData: any
  }
  comparison?: {
    similarities: string[]
    differences: string[]
    suggestions: string[]
    detailedAnalysis?: any
  }
}

export interface AssessmentInsights {
  overallPerformance: {
    averageScore: number
    totalSubmissions: number
    completedAssessments: number
    pendingAssessments: number
    failedAssessments: number
  }
  trends: {
    improvementAreas: string[]
    strongAreas: string[]
    commonMistakes: string[]
  }
  recommendations: string[]
}

/**
 * Assessment Result Management Service
 * Handles viewing, filtering, and analyzing assessment results
 */
export class AssessmentResultManager {

  /**
   * Get assessment results with filtering and pagination
   */
  static async getAssessmentResults(filters: {
    courseId?: string
    questionId?: string
    studentId?: string
    status?: SubmissionStatus
    minScore?: number
    maxScore?: number
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    offset?: number
  } = {}): Promise<{
    results: AssessmentResultSummary[]
    total: number
    hasMore: boolean
  }> {

    try {
      const user = await requireAuth()

      // Build where clause based on user role and filters
      let whereClause: any = {}

      // Role-based access control
      if (user.role === Role.STUDENT) {
        whereClause.studentId = user.id
      } else if (user.role === Role.COURSE_ADMIN) {
        whereClause.question = {
          course: {
            adminId: user.id
          }
        }
      }
      // SUPER_ADMIN can see all results

      // Apply filters
      if (filters.courseId) {
        whereClause.question = {
          ...whereClause.question,
          courseId: filters.courseId
        }
      }

      if (filters.questionId) {
        whereClause.questionId = filters.questionId
      }

      if (filters.studentId && user.role !== Role.STUDENT) {
        whereClause.studentId = filters.studentId
      }

      if (filters.status) {
        whereClause.status = filters.status
      }

      if (filters.minScore !== undefined || filters.maxScore !== undefined) {
        whereClause.score = {}
        if (filters.minScore !== undefined) {
          whereClause.score.gte = filters.minScore
        }
        if (filters.maxScore !== undefined) {
          whereClause.score.lte = filters.maxScore
        }
      }

      if (filters.dateFrom || filters.dateTo) {
        whereClause.submittedAt = {}
        if (filters.dateFrom) {
          whereClause.submittedAt.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          whereClause.submittedAt.lte = filters.dateTo
        }
      }

      // Get total count
      const total = await prisma.submission.count({ where: whereClause })

      // Get paginated results
      const limit = Math.min(filters.limit || 50, 100)
      const offset = filters.offset || 0

      const submissions = await prisma.submission.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true, name: true, email: true }
          },
          question: {
            select: {
              id: true,
              title: true,
              baseExample: {
                select: { id: true }
              },
              course: {
                select: { id: true, title: true }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset
      })

      const results: AssessmentResultSummary[] = submissions.map(submission => ({
        submissionId: submission.id,
        studentName: submission.student.name || 'Unknown',
        questionTitle: submission.question.title,
        courseTitle: submission.question.course.title,
        score: submission.score,
        status: submission.status,
        submittedAt: submission.submittedAt,
        processedAt: submission.processedAt,
        confidence: submission.confidence,
        hasComparison: !!submission.question.baseExample
      }))

      return {
        results,
        total,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('Failed to get assessment results:', error)
      throw new Error('Failed to retrieve assessment results')
    }
  }

  /**
   * Get detailed assessment result with comparison data
   */
  static async getDetailedAssessmentResult(submissionId: string): Promise<DetailedAssessmentResult> {
    try {
      const user = await requireAuth()

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          student: {
            select: { id: true, name: true, email: true }
          },
          question: {
            include: {
              baseExample: true,
              course: {
                select: { id: true, title: true }
              }
            }
          }
        }
      })

      if (!submission) {
        throw new Error('Submission not found')
      }

      // Permission check
      const hasAccess =
        submission.studentId === user.id ||
        user.role === Role.SUPER_ADMIN ||
        (user.role === Role.COURSE_ADMIN && submission.question.course.id &&
         await this.userAdministratesCourse(user.id, submission.question.course.id))

      if (!hasAccess) {
        throw new Error('Insufficient permissions to view this result')
      }

      // Format comparison data
      let comparison
      if (submission.comparisonData && typeof submission.comparisonData === 'object') {
        comparison = {
          similarities: submission.comparisonData.similarities || [],
          differences: submission.comparisonData.differences || [],
          suggestions: submission.comparisonData.suggestions || [],
          detailedAnalysis: submission.comparisonData.detailedAnalysis || null
        }
      }

      return {
        submission: {
          id: submission.id,
          content: submission.content,
          fileUrl: submission.fileUrl,
          websiteUrl: submission.websiteUrl,
          githubUrl: submission.githubUrl,
          status: submission.status,
          submittedAt: submission.submittedAt,
          processedAt: submission.processedAt
        },
        student: submission.student,
        question: {
          id: submission.question.id,
          title: submission.question.title,
          description: submission.question.description,
          submissionType: submission.question.submissionType,
          criteria: submission.question.criteria,
          baseExample: submission.question.baseExample ? {
            id: submission.question.baseExample.id,
            content: submission.question.baseExample.content,
            type: submission.question.baseExample.type,
            metadata: submission.question.baseExample.metadata
          } : null
        },
        course: submission.question.course,
        assessment: {
          score: submission.score,
          feedback: submission.feedback,
          confidence: submission.confidence,
          comparisonData: submission.comparisonData
        },
        comparison
      }

    } catch (error) {
      console.error('Failed to get detailed assessment result:', error)
      throw new Error('Failed to retrieve detailed assessment result')
    }
  }

  /**
   * Get assessment insights for a course or question
   */
  static async getAssessmentInsights(scope: {
    courseId?: string
    questionId?: string
    studentId?: string
  }): Promise<AssessmentInsights> {

    try {
      const user = await requireAuth()

      // Build query based on scope and permissions
      let whereClause: any = {}

      if (user.role === Role.STUDENT) {
        whereClause.studentId = user.id
      } else if (user.role === Role.COURSE_ADMIN) {
        whereClause.question = {
          course: {
            adminId: user.id
          }
        }
      }

      if (scope.courseId) {
        whereClause.question = {
          ...whereClause.question,
          courseId: scope.courseId
        }
      }

      if (scope.questionId) {
        whereClause.questionId = scope.questionId
      }

      if (scope.studentId && user.role !== Role.STUDENT) {
        whereClause.studentId = scope.studentId
      }

      // Get submissions with assessment data
      const submissions = await prisma.submission.findMany({
        where: {
          ...whereClause,
          status: SubmissionStatus.COMPLETED,
          score: { not: null }
        },
        include: {
          question: {
            select: { title: true, submissionType: true }
          }
        }
      })

      if (submissions.length === 0) {
        return {
          overallPerformance: {
            averageScore: 0,
            totalSubmissions: 0,
            completedAssessments: 0,
            pendingAssessments: 0,
            failedAssessments: 0
          },
          trends: {
            improvementAreas: [],
            strongAreas: [],
            commonMistakes: []
          },
          recommendations: ['No completed assessments available for analysis']
        }
      }

      // Calculate overall performance
      const scores = submissions.map(s => s.score!).filter(score => score !== null)
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

      // Get status counts
      const statusCounts = await prisma.submission.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      })

      const overallPerformance = {
        averageScore: Math.round(averageScore * 100) / 100,
        totalSubmissions: submissions.length,
        completedAssessments: statusCounts.find(s => s.status === 'COMPLETED')?._count.status || 0,
        pendingAssessments: statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
        failedAssessments: statusCounts.find(s => s.status === 'FAILED')?._count.status || 0
      }

      // Analyze trends from comparison data
      const allComparisons = submissions
        .map(s => s.comparisonData)
        .filter(data => data && typeof data === 'object')

      const allDifferences = allComparisons
        .flatMap(comp => comp.differences || [])
        .filter(diff => typeof diff === 'string')

      const allSimilarities = allComparisons
        .flatMap(comp => comp.similarities || [])
        .filter(sim => typeof sim === 'string')

      // Find common patterns
      const improvementAreas = this.findCommonPatterns(allDifferences, 3)
      const strongAreas = this.findCommonPatterns(allSimilarities, 3)

      const trends = {
        improvementAreas,
        strongAreas,
        commonMistakes: allDifferences.slice(0, 5)
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(overallPerformance, trends)

      return {
        overallPerformance,
        trends,
        recommendations
      }

    } catch (error) {
      console.error('Failed to get assessment insights:', error)
      throw new Error('Failed to generate assessment insights')
    }
  }

  /**
   * Export assessment results to CSV format
   */
  static async exportAssessmentResults(filters: any): Promise<string> {
    try {
      const { results } = await this.getAssessmentResults(filters)

      const csvHeaders = [
        'Submission ID',
        'Student Name',
        'Question Title',
        'Course Title',
        'Score',
        'Status',
        'Submitted At',
        'Processed At',
        'Confidence',
        'Has Base Example'
      ]

      const csvRows = results.map(result => [
        result.submissionId,
        result.studentName,
        result.questionTitle,
        result.courseTitle,
        result.score?.toString() || '',
        result.status,
        result.submittedAt.toISOString(),
        result.processedAt?.toISOString() || '',
        result.confidence?.toString() || '',
        result.hasComparison.toString()
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return csvContent

    } catch (error) {
      console.error('Failed to export assessment results:', error)
      throw new Error('Failed to export assessment results')
    }
  }

  // Helper methods
  private static async userAdministratesCourse(userId: string, courseId: string): Promise<boolean> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { adminId: true }
    })
    return course?.adminId === userId
  }

  private static findCommonPatterns(items: string[], limit: number): string[] {
    const frequency = new Map<string, number>()

    items.forEach(item => {
      const count = frequency.get(item) || 0
      frequency.set(item, count + 1)
    })

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item)
  }

  private static generateRecommendations(performance: any, trends: any): string[] {
    const recommendations: string[] = []

    if (performance.averageScore < 60) {
      recommendations.push('Overall performance needs significant improvement - consider reviewing learning materials')
    } else if (performance.averageScore < 80) {
      recommendations.push('Good progress, but there is room for improvement in key areas')
    } else {
      recommendations.push('Excellent performance overall - maintain current learning approach')
    }

    if (trends.improvementAreas.length > 0) {
      recommendations.push(`Focus on improving: ${trends.improvementAreas.slice(0, 2).join(', ')}`)
    }

    if (trends.strongAreas.length > 0) {
      recommendations.push(`Continue leveraging strengths in: ${trends.strongAreas.slice(0, 2).join(', ')}`)
    }

    if (performance.failedAssessments > performance.completedAssessments * 0.2) {
      recommendations.push('High failure rate detected - consider reviewing submission guidelines')
    }

    return recommendations
  }
}

// Convenience functions
export async function getMyAssessmentResults(filters: any = {}) {
  return AssessmentResultManager.getAssessmentResults(filters)
}

export async function getSubmissionResult(submissionId: string) {
  return AssessmentResultManager.getDetailedAssessmentResult(submissionId)
}

export async function getCourseInsights(courseId: string) {
  return AssessmentResultManager.getAssessmentInsights({ courseId })
}