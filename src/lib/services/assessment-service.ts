// Assessment service with server actions

import { prisma } from '@/lib/db'
import {
  assessSubmission,
  assessTextSubmission,
  assessDocumentSubmission,
  assessWebsiteSubmission,
  assessGitHubSubmission,
  determineComplexity,
  healthCheck
} from './llm-service'
import {
  BaseExampleComparisonEngine,
  performDetailedComparison,
  performBasicComparison,
  type EnhancedAssessmentResult as ComparisonResult
} from './comparison-engine'
import { SubmissionType, SubmissionStatus } from '@prisma/client'

export interface AssessmentConfig {
  useBaseExample: boolean
  customCriteria?: string
  strictMode?: boolean // Stricter comparison to base example
  includeMetrics?: boolean // Include additional metrics in assessment
  useDetailedComparison?: boolean // Use enhanced comparison engine
  includeInsights?: boolean // Include actionable insights
}

export interface AssessmentMetrics {
  processingTime: number
  complexity: string
  tokenUsage?: number
  modelUsed: string
  confidence: number
}

export interface EnhancedAssessmentResult {
  score: number
  feedback: string
  confidence: number
  comparisonData: {
    similarities: string[]
    differences: string[]
    suggestions: string[]
  }
  metrics: AssessmentMetrics
  rawAssessment?: any
}

/**
 * Core assessment engine that compares submissions against base examples
 */
export class AssessmentEngine {

  /**
   * Assess a submission against its question's base example
   */
  static async assessSubmissionWithBase(
    submissionId: string,
    config: AssessmentConfig = { useBaseExample: true }
  ): Promise<EnhancedAssessmentResult> {
    const startTime = Date.now()

    try {
      // Get submission with all related data
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          question: {
            include: {
              baseExample: true,
              course: true
            }
          },
          student: true
        }
      })

      if (!submission) {
        throw new Error('Submission not found')
      }

      if (!submission.question.baseExample && config.useBaseExample) {
        throw new Error('No base example available for this question')
      }

      // Get submission content based on type
      const submissionContent = this.extractSubmissionContent(submission)
      if (!submissionContent) {
        throw new Error('No content found in submission')
      }

      // Determine complexity for optimal LLM routing
      const complexity = determineComplexity(
        submission.question.submissionType,
        submissionContent.length,
        submission.question.submissionType === SubmissionType.GITHUB_REPO
      )

      // Choose assessment method based on configuration
      let assessment
      if (config.useDetailedComparison) {
        // Use enhanced comparison engine
        assessment = await BaseExampleComparisonEngine.compareWithBaseExample(
          submissionContent,
          submission.question.baseExample?.content || '',
          {
            title: submission.question.title,
            description: submission.question.description,
            criteria: config.customCriteria || submission.question.criteria
          },
          submission.question.submissionType,
          {
            includeDetailedAnalysis: true,
            includeInsights: config.includeInsights || false,
            complexity
          }
        )
      } else {
        // Use standard LLM assessment
        assessment = await this.performTypedAssessment(
          submission.question.submissionType,
          submissionContent,
          submission.question.baseExample?.content || '',
          {
            title: submission.question.title,
            description: submission.question.description,
            criteria: config.customCriteria || submission.question.criteria
          }
        )
      }

      const processingTime = Date.now() - startTime

      return {
        ...assessment,
        metrics: {
          processingTime,
          complexity: complexity.toString(),
          modelUsed: this.getModelForComplexity(complexity),
          confidence: assessment.confidence
        }
      }

    } catch (error) {
      console.error('Assessment engine error:', error)

      return {
        score: 0,
        feedback: `Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        comparisonData: {
          similarities: [],
          differences: ['Assessment could not be completed'],
          suggestions: ['Please contact support or try resubmitting']
        },
        metrics: {
          processingTime: Date.now() - startTime,
          complexity: 'unknown',
          modelUsed: 'none',
          confidence: 0
        }
      }
    }
  }

  /**
   * Batch assess multiple submissions
   */
  static async batchAssessSubmissions(
    submissionIds: string[],
    config: AssessmentConfig = { useBaseExample: true }
  ): Promise<Record<string, EnhancedAssessmentResult>> {
    const results: Record<string, EnhancedAssessmentResult> = {}

    // Process submissions in parallel batches to avoid overwhelming the LLM service
    const batchSize = 3
    for (let i = 0; i < submissionIds.length; i += batchSize) {
      const batch = submissionIds.slice(i, i + batchSize)

      const batchPromises = batch.map(async (id) => {
        const result = await this.assessSubmissionWithBase(id, config)
        return { id, result }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ id, result }) => {
        results[id] = result
      })

      // Small delay between batches to be respectful to the API
      if (i + batchSize < submissionIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  /**
   * Compare submission against base example with detailed analysis
   */
  static async compareWithBaseExample(
    submissionContent: string,
    baseExampleContent: string,
    submissionType: SubmissionType,
    question: { title: string; description: string; criteria?: string }
  ): Promise<{
    similarityScore: number
    detailedComparison: {
      structuralSimilarity: number
      contentSimilarity: number
      qualitySimilarity: number
    }
    gaps: string[]
    strengths: string[]
  }> {
    try {
      const assessment = await assessSubmission({
        submissionContent,
        baseExampleContent,
        question,
        submissionType
      })

      // Enhanced analysis based on assessment results
      const similarityScore = assessment.score
      const gaps = assessment.comparisonData.differences
      const strengths = assessment.comparisonData.similarities

      // Calculate detailed similarity metrics (simplified for Sprint 1)
      const detailedComparison = {
        structuralSimilarity: Math.max(0, similarityScore - 20), // Rough estimation
        contentSimilarity: similarityScore,
        qualitySimilarity: Math.min(100, similarityScore + (assessment.confidence * 20))
      }

      return {
        similarityScore,
        detailedComparison,
        gaps,
        strengths
      }
    } catch (error) {
      console.error('Base example comparison error:', error)
      return {
        similarityScore: 0,
        detailedComparison: {
          structuralSimilarity: 0,
          contentSimilarity: 0,
          qualitySimilarity: 0
        },
        gaps: ['Comparison failed'],
        strengths: []
      }
    }
  }

  /**
   * Assess submission and update database record
   */
  static async processAndStoreAssessment(submissionId: string): Promise<void> {
    try {
      // Update status to processing
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.PROCESSING }
      })

      // Perform assessment
      const result = await this.assessSubmissionWithBase(submissionId)

      // Store results in database
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.COMPLETED,
          score: result.score,
          feedback: result.feedback,
          confidence: result.confidence,
          comparisonData: result.comparisonData,
          processedAt: new Date()
        }
      })

      console.log(`Successfully processed submission ${submissionId}`)
    } catch (error) {
      console.error(`Failed to process submission ${submissionId}:`, error)

      // Mark as failed
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.FAILED,
          feedback: `Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          processedAt: new Date()
        }
      })
    }
  }

  /**
   * Health check for the assessment service
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: {
      llm: boolean
      database: boolean
    }
    latency?: number
  }> {
    const startTime = Date.now()

    try {
      // Check LLM service
      const llmHealthy = await healthCheck()

      // Check database
      let dbHealthy = false
      try {
        await prisma.$queryRaw`SELECT 1`
        dbHealthy = true
      } catch (error) {
        console.error('Database health check failed:', error)
      }

      const latency = Date.now() - startTime

      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (llmHealthy && dbHealthy) {
        status = 'healthy'
      } else if (llmHealthy || dbHealthy) {
        status = 'degraded'
      } else {
        status = 'unhealthy'
      }

      return {
        status,
        services: {
          llm: llmHealthy,
          database: dbHealthy
        },
        latency
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        services: {
          llm: false,
          database: false
        }
      }
    }
  }

  // Private helper methods
  private static extractSubmissionContent(submission: any): string | null {
    switch (submission.question.submissionType) {
      case SubmissionType.TEXT:
        return submission.content
      case SubmissionType.WEBSITE:
        return submission.websiteUrl
      case SubmissionType.GITHUB_REPO:
        return submission.githubUrl
      case SubmissionType.DOCUMENT:
        return submission.fileUrl
      default:
        return null
    }
  }

  private static async performTypedAssessment(
    type: SubmissionType,
    content: string,
    baseExample: string,
    question: { title: string; description: string; criteria?: string }
  ) {
    switch (type) {
      case SubmissionType.TEXT:
        return await assessTextSubmission(content, baseExample, question)
      case SubmissionType.DOCUMENT:
        return await assessDocumentSubmission(content, baseExample, question)
      case SubmissionType.WEBSITE:
        return await assessWebsiteSubmission(content, baseExample, question)
      case SubmissionType.GITHUB_REPO:
        return await assessGitHubSubmission(content, baseExample, question)
      default:
        return await assessSubmission({
          submissionContent: content,
          baseExampleContent: baseExample,
          question,
          submissionType: type
        })
    }
  }

  private static getModelForComplexity(complexity: any): string {
    // Map complexity to model names (matches LLM service)
    const complexityMap: Record<string, string> = {
      'basic': 'llama-3.1-8b-instant',
      'standard': 'llama-3.1-70b-versatile',
      'complex': 'llama-3.1-70b-versatile',
      'agentic': 'llama-3.1-70b-versatile'
    }
    return complexityMap[complexity.toString()] || 'llama-3.1-8b-instant'
  }
}

// Convenience functions for easier usage
export async function assessSubmissionById(submissionId: string) {
  return AssessmentEngine.assessSubmissionWithBase(submissionId)
}

export async function batchAssessSubmissions(submissionIds: string[]) {
  return AssessmentEngine.batchAssessSubmissions(submissionIds)
}

export async function processSubmission(submissionId: string) {
  return AssessmentEngine.processAndStoreAssessment(submissionId)
}

export async function getAssessmentHealth() {
  return AssessmentEngine.healthCheck()
}