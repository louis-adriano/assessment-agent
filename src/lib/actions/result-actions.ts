'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { SubmissionStatus, Role } from '@prisma/client'
import {
  AssessmentResultManager,
  getMyAssessmentResults,
  getSubmissionResult,
  getCourseInsights
} from '@/lib/services/result-management'

const getResultsSchema = z.object({
  courseId: z.string().optional(),
  questionId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

const exportResultsSchema = z.object({
  courseId: z.string().optional(),
  questionId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get assessment results with filtering and pagination
 */
export async function getAssessmentResults(
  filters: z.infer<typeof getResultsSchema> = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const validatedFilters = getResultsSchema.parse(filters)

    const results = await AssessmentResultManager.getAssessmentResults(validatedFilters)

    return { success: true, data: results }
  } catch (error) {
    console.error('Get assessment results error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get assessment results'
    }
  }
}

/**
 * Get detailed assessment result for a specific submission
 */
export async function getDetailedAssessmentResult(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    if (!submissionId) {
      return { success: false, error: 'Submission ID is required' }
    }

    const result = await AssessmentResultManager.getDetailedAssessmentResult(submissionId)

    return { success: true, data: result }
  } catch (error) {
    console.error('Get detailed assessment result error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get detailed assessment result'
    }
  }
}

/**
 * Get assessment insights for analysis
 */
export async function getAssessmentInsights(scope: {
  courseId?: string
  questionId?: string
  studentId?: string
} = {}): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const insights = await AssessmentResultManager.getAssessmentInsights(scope)

    return { success: true, data: insights }
  } catch (error) {
    console.error('Get assessment insights error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get assessment insights'
    }
  }
}

/**
 * Export assessment results to CSV
 */
export async function exportAssessmentResults(
  filters: z.infer<typeof exportResultsSchema> = {}
): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Only admins can export data
    if (user.role === Role.STUDENT) {
      return { success: false, error: 'Insufficient permissions to export data' }
    }

    const validatedFilters = exportResultsSchema.parse(filters)
    const csvContent = await AssessmentResultManager.exportAssessmentResults(validatedFilters)

    return {
      success: true,
      data: {
        content: csvContent,
        filename: `assessment-results-${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv'
      }
    }
  } catch (error) {
    console.error('Export assessment results error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export assessment results'
    }
  }
}

/**
 * Get submission comparison highlights
 */
export async function getSubmissionComparison(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const detailedResult = await AssessmentResultManager.getDetailedAssessmentResult(submissionId)

    if (!detailedResult.comparison) {
      return {
        success: false,
        error: 'No comparison data available for this submission'
      }
    }

    // Extract and format comparison highlights
    const highlights = {
      overallScore: detailedResult.assessment.score,
      confidence: detailedResult.assessment.confidence,
      keyStrengths: detailedResult.comparison.similarities.slice(0, 3),
      mainDifferences: detailedResult.comparison.differences.slice(0, 3),
      topSuggestions: detailedResult.comparison.suggestions.slice(0, 3),
      hasBaseExample: !!detailedResult.question.baseExample,
      submissionType: detailedResult.question.submissionType
    }

    return { success: true, data: highlights }
  } catch (error) {
    console.error('Get submission comparison error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get submission comparison'
    }
  }
}

/**
 * Get performance summary for a student or course
 */
export async function getPerformanceSummary(scope: {
  courseId?: string
  studentId?: string
  timeFrame?: 'week' | 'month' | 'semester' | 'all'
}): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Build date filter based on timeframe
    let dateFrom: Date | undefined
    const now = new Date()

    switch (scope.timeFrame) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'semester':
        dateFrom = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        break
      default:
        dateFrom = undefined
    }

    // Get results and insights
    const filters = {
      courseId: scope.courseId,
      studentId: scope.studentId,
      dateFrom,
      limit: 100
    }

    const [resultsResponse, insightsResponse] = await Promise.all([
      AssessmentResultManager.getAssessmentResults(filters),
      AssessmentResultManager.getAssessmentInsights({
        courseId: scope.courseId,
        studentId: scope.studentId
      })
    ])

    // Calculate additional metrics
    const completedResults = resultsResponse.results.filter(r => r.status === SubmissionStatus.COMPLETED && r.score !== null)
    const scores = completedResults.map(r => r.score!).filter(s => s !== null)

    const summary = {
      timeFrame: scope.timeFrame || 'all',
      totalSubmissions: resultsResponse.results.length,
      completedSubmissions: completedResults.length,
      averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      improvementTrend: this.calculateImprovementTrend(completedResults),
      insights: insightsResponse,
      recentSubmissions: resultsResponse.results.slice(0, 5)
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Get performance summary error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get performance summary'
    }
  }
}

/**
 * Search submissions by content or feedback
 */
export async function searchSubmissions(query: {
  searchTerm: string
  searchIn: 'content' | 'feedback' | 'both'
  courseId?: string
  limit?: number
}): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    if (!query.searchTerm || query.searchTerm.trim().length < 2) {
      return { success: false, error: 'Search term must be at least 2 characters long' }
    }

    // This is a simplified search - in production, you'd use full-text search
    const filters = {
      courseId: query.courseId,
      limit: query.limit || 20
    }

    const allResults = await AssessmentResultManager.getAssessmentResults(filters)

    // Get detailed results for content search
    const searchPromises = allResults.results.slice(0, 50).map(async (result) => {
      try {
        const detailed = await AssessmentResultManager.getDetailedAssessmentResult(result.submissionId)
        return { result, detailed }
      } catch (error) {
        return null
      }
    })

    const detailedResults = (await Promise.all(searchPromises)).filter(r => r !== null)

    // Simple text search
    const searchTerm = query.searchTerm.toLowerCase()
    const matches = detailedResults.filter(({ detailed }) => {
      if (query.searchIn === 'content' || query.searchIn === 'both') {
        const content = detailed.submission.content?.toLowerCase() || ''
        if (content.includes(searchTerm)) return true
      }

      if (query.searchIn === 'feedback' || query.searchIn === 'both') {
        const feedback = detailed.assessment.feedback?.toLowerCase() || ''
        if (feedback.includes(searchTerm)) return true
      }

      return false
    })

    const searchResults = matches.map(({ result, detailed }) => ({
      ...result,
      matchType: query.searchIn,
      preview: this.generateSearchPreview(detailed, searchTerm, query.searchIn)
    }))

    return {
      success: true,
      data: {
        results: searchResults,
        total: searchResults.length,
        searchTerm: query.searchTerm,
        searchIn: query.searchIn
      }
    }
  } catch (error) {
    console.error('Search submissions error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search submissions'
    }
  }
}

// Helper methods
function calculateImprovementTrend(results: any[]): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
  if (results.length < 3) return 'insufficient_data'

  const recentResults = results
    .filter(r => r.score !== null)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .slice(-5)

  if (recentResults.length < 3) return 'insufficient_data'

  const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2))
  const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2))

  const firstAvg = firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length

  const difference = secondAvg - firstAvg

  if (difference > 5) return 'improving'
  if (difference < -5) return 'declining'
  return 'stable'
}

function generateSearchPreview(detailed: any, searchTerm: string, searchIn: string): string {
  const maxLength = 150

  if (searchIn === 'content' || searchIn === 'both') {
    const content = detailed.submission.content || ''
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase())
    if (index !== -1) {
      const start = Math.max(0, index - 50)
      const end = Math.min(content.length, index + searchTerm.length + 50)
      let preview = content.substring(start, end)
      if (start > 0) preview = '...' + preview
      if (end < content.length) preview = preview + '...'
      return preview.substring(0, maxLength)
    }
  }

  if (searchIn === 'feedback' || searchIn === 'both') {
    const feedback = detailed.assessment.feedback || ''
    const index = feedback.toLowerCase().indexOf(searchTerm.toLowerCase())
    if (index !== -1) {
      const start = Math.max(0, index - 50)
      const end = Math.min(feedback.length, index + searchTerm.length + 50)
      let preview = feedback.substring(start, end)
      if (start > 0) preview = '...' + preview
      if (end < feedback.length) preview = preview + '...'
      return preview.substring(0, maxLength)
    }
  }

  return 'No preview available'
}