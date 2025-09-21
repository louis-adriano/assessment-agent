'use server'

import { SubmissionType } from '@prisma/client'
import { performDetailedComparison, performBasicComparison } from './comparison-engine'
import { assessTextSubmission } from './llm-service'

export interface TextAssessmentOptions {
  compareToBaseExample: boolean
  includeDetailedAnalysis: boolean
  includeStyleAnalysis: boolean
  includeStructureAnalysis: boolean
  customCriteria?: string[]
}

export interface TextAssessmentResult {
  score: number
  confidence: number
  feedback: string
  comparison: {
    similarities: string[]
    differences: string[]
    suggestions: string[]
  }
  analysis?: {
    structure: {
      score: number
      strengths: string[]
      improvements: string[]
    }
    content: {
      score: number
      completeness: number
      accuracy: number
      relevance: number
    }
    style: {
      score: number
      clarity: number
      coherence: number
      grammar: number
    }
  }
  insights?: {
    keyStrengths: string[]
    priorityImprovements: string[]
    nextSteps: string[]
  }
}

/**
 * Specialized text assessment service with detailed base example comparison
 */
export class TextAssessmentService {

  /**
   * Assess text submission with comprehensive comparison to base example
   */
  static async assessTextWithBaseExample(
    submissionText: string,
    baseExampleText: string,
    question: {
      title: string
      description: string
      criteria?: string
    },
    options: TextAssessmentOptions = {
      compareToBaseExample: true,
      includeDetailedAnalysis: false,
      includeStyleAnalysis: false,
      includeStructureAnalysis: false
    }
  ): Promise<TextAssessmentResult> {

    try {
      if (!submissionText?.trim()) {
        throw new Error('No text content provided for assessment')
      }

      if (!baseExampleText?.trim() && options.compareToBaseExample) {
        throw new Error('No base example available for comparison')
      }

      // Perform base assessment
      let baseAssessment
      if (options.compareToBaseExample && options.includeDetailedAnalysis) {
        // Use enhanced comparison engine
        baseAssessment = await performDetailedComparison(
          submissionText,
          baseExampleText,
          question,
          SubmissionType.TEXT
        )
      } else if (options.compareToBaseExample) {
        // Use basic comparison
        baseAssessment = await performBasicComparison(
          submissionText,
          baseExampleText,
          question,
          SubmissionType.TEXT
        )
      } else {
        // Direct assessment without base example
        baseAssessment = await assessTextSubmission(
          submissionText,
          baseExampleText || '',
          question
        )
      }

      // Build result object
      const result: TextAssessmentResult = {
        score: baseAssessment.score,
        confidence: baseAssessment.confidence,
        feedback: baseAssessment.feedback,
        comparison: baseAssessment.comparisonData || {
          similarities: [],
          differences: [],
          suggestions: []
        }
      }

      // Add detailed analysis if requested
      if (options.includeDetailedAnalysis && 'detailedComparison' in baseAssessment) {
        result.analysis = {
          structure: {
            score: baseAssessment.detailedComparison.structuralAnalysis.score,
            strengths: baseAssessment.detailedComparison.structuralAnalysis.strengths,
            improvements: baseAssessment.detailedComparison.structuralAnalysis.gaps
          },
          content: {
            score: baseAssessment.detailedComparison.contentAnalysis.score,
            completeness: Math.max(0, baseAssessment.detailedComparison.contentAnalysis.score - 5),
            accuracy: baseAssessment.detailedComparison.contentAnalysis.score,
            relevance: Math.min(100, baseAssessment.detailedComparison.contentAnalysis.score + 5)
          },
          style: {
            score: baseAssessment.detailedComparison.qualityAnalysis.score,
            clarity: baseAssessment.detailedComparison.qualityAnalysis.score,
            coherence: Math.max(0, baseAssessment.detailedComparison.qualityAnalysis.score - 3),
            grammar: Math.min(100, baseAssessment.detailedComparison.qualityAnalysis.score + 3)
          }
        }

        // Add insights
        if ('insights' in baseAssessment) {
          result.insights = {
            keyStrengths: baseAssessment.insights.keyStrengths,
            priorityImprovements: baseAssessment.insights.criticalGaps,
            nextSteps: baseAssessment.insights.nextSteps
          }
        }
      }

      return result

    } catch (error) {
      console.error('Text assessment failed:', error)

      return {
        score: 0,
        confidence: 0,
        feedback: `Text assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        comparison: {
          similarities: [],
          differences: ['Assessment could not be completed'],
          suggestions: ['Please check your submission and try again']
        }
      }
    }
  }

  /**
   * Assess text submission with focus on specific aspects
   */
  static async assessTextAspects(
    submissionText: string,
    baseExampleText: string,
    question: any,
    aspects: {
      checkGrammar?: boolean
      checkStructure?: boolean
      checkContent?: boolean
      checkStyle?: boolean
    }
  ): Promise<{
    overall: TextAssessmentResult
    aspectScores: Record<string, number>
    aspectFeedback: Record<string, string>
  }> {

    try {
      // Get overall assessment
      const overallAssessment = await this.assessTextWithBaseExample(
        submissionText,
        baseExampleText,
        question,
        {
          compareToBaseExample: true,
          includeDetailedAnalysis: true,
          includeStyleAnalysis: aspects.checkStyle || false,
          includeStructureAnalysis: aspects.checkStructure || false
        }
      )

      // Calculate aspect-specific scores and feedback
      const aspectScores: Record<string, number> = {}
      const aspectFeedback: Record<string, string> = {}

      if (aspects.checkGrammar) {
        aspectScores.grammar = overallAssessment.analysis?.style.grammar || overallAssessment.score
        aspectFeedback.grammar = this.generateGrammarFeedback(submissionText, overallAssessment)
      }

      if (aspects.checkStructure) {
        aspectScores.structure = overallAssessment.analysis?.structure.score || overallAssessment.score
        aspectFeedback.structure = this.generateStructureFeedback(submissionText, overallAssessment)
      }

      if (aspects.checkContent) {
        aspectScores.content = overallAssessment.analysis?.content.score || overallAssessment.score
        aspectFeedback.content = this.generateContentFeedback(submissionText, overallAssessment)
      }

      if (aspects.checkStyle) {
        aspectScores.style = overallAssessment.analysis?.style.score || overallAssessment.score
        aspectFeedback.style = this.generateStyleFeedback(submissionText, overallAssessment)
      }

      return {
        overall: overallAssessment,
        aspectScores,
        aspectFeedback
      }

    } catch (error) {
      console.error('Aspect assessment failed:', error)

      return {
        overall: await this.assessTextWithBaseExample(submissionText, baseExampleText, question),
        aspectScores: {},
        aspectFeedback: { error: 'Aspect analysis failed' }
      }
    }
  }

  /**
   * Compare multiple text submissions against the same base example
   */
  static async batchAssessTexts(
    submissions: Array<{
      id: string
      text: string
    }>,
    baseExampleText: string,
    question: any
  ): Promise<Record<string, TextAssessmentResult>> {

    const results: Record<string, TextAssessmentResult> = {}

    // Process in small batches to avoid overwhelming the LLM service
    const batchSize = 3
    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize)

      const batchPromises = batch.map(async (submission) => {
        const result = await this.assessTextWithBaseExample(
          submission.text,
          baseExampleText,
          question,
          { compareToBaseExample: true, includeDetailedAnalysis: true }
        )
        return { id: submission.id, result }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ id, result }) => {
        results[id] = result
      })

      // Brief pause between batches
      if (i + batchSize < submissions.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return results
  }

  // Helper methods for aspect-specific feedback
  private static generateGrammarFeedback(text: string, assessment: TextAssessmentResult): string {
    if (assessment.analysis?.style.grammar && assessment.analysis.style.grammar >= 90) {
      return 'Excellent grammar and writing mechanics.'
    } else if (assessment.analysis?.style.grammar && assessment.analysis.style.grammar >= 70) {
      return 'Good grammar overall with minor areas for improvement.'
    } else {
      return 'Grammar and writing mechanics need attention. Consider proofreading and checking for common errors.'
    }
  }

  private static generateStructureFeedback(text: string, assessment: TextAssessmentResult): string {
    if (assessment.analysis?.structure.score && assessment.analysis.structure.score >= 90) {
      return 'Well-organized structure that effectively communicates ideas.'
    } else if (assessment.analysis?.structure.score && assessment.analysis.structure.score >= 70) {
      return 'Good structure with room for improvement in organization or flow.'
    } else {
      return 'Structure needs improvement. Consider reorganizing ideas for better clarity and flow.'
    }
  }

  private static generateContentFeedback(text: string, assessment: TextAssessmentResult): string {
    if (assessment.analysis?.content.score && assessment.analysis.content.score >= 90) {
      return 'Content is comprehensive, accurate, and highly relevant.'
    } else if (assessment.analysis?.content.score && assessment.analysis.content.score >= 70) {
      return 'Good content with minor gaps or areas that could be expanded.'
    } else {
      return 'Content needs significant improvement. Consider adding missing elements and improving accuracy.'
    }
  }

  private static generateStyleFeedback(text: string, assessment: TextAssessmentResult): string {
    if (assessment.analysis?.style.score && assessment.analysis.style.score >= 90) {
      return 'Excellent writing style that is clear, engaging, and appropriate.'
    } else if (assessment.analysis?.style.score && assessment.analysis.style.score >= 70) {
      return 'Good writing style with opportunities to enhance clarity or engagement.'
    } else {
      return 'Writing style needs improvement. Focus on clarity, coherence, and appropriate tone.'
    }
  }
}

// Convenience functions
export async function assessTextSubmissionWithBase(
  submissionText: string,
  baseExampleText: string,
  question: { title: string; description: string; criteria?: string }
) {
  return TextAssessmentService.assessTextWithBaseExample(
    submissionText,
    baseExampleText,
    question,
    { compareToBaseExample: true, includeDetailedAnalysis: true }
  )
}

export async function quickTextAssessment(
  submissionText: string,
  baseExampleText: string,
  question: { title: string; description: string; criteria?: string }
) {
  return TextAssessmentService.assessTextWithBaseExample(
    submissionText,
    baseExampleText,
    question,
    { compareToBaseExample: true, includeDetailedAnalysis: false }
  )
}