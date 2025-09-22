// Base example comparison engine

import { SubmissionType } from '@prisma/client'
import { assessSubmission, LLMComplexity } from './llm-service'

export interface DetailedComparison {
  overallSimilarity: number
  structuralAnalysis: {
    score: number
    strengths: string[]
    gaps: string[]
  }
  contentAnalysis: {
    score: number
    similarities: string[]
    differences: string[]
    missing_elements: string[]
  }
  qualityAnalysis: {
    score: number
    strengths: string[]
    improvements: string[]
  }
  complianceAnalysis: {
    score: number
    metCriteria: string[]
    missedCriteria: string[]
  }
}

export interface ComparisonInsights {
  keyStrengths: string[]
  criticalGaps: string[]
  improvementPriority: Array<{
    area: string
    impact: 'high' | 'medium' | 'low'
    suggestions: string[]
  }>
  nextSteps: string[]
}

export interface EnhancedAssessmentResult {
  score: number
  confidence: number
  feedback: string
  detailedComparison: DetailedComparison
  insights: ComparisonInsights
  comparisonData: {
    similarities: string[]
    differences: string[]
    suggestions: string[]
  }
}

/**
 * Advanced comparison engine that provides detailed analysis against base examples
 */
export class BaseExampleComparisonEngine {

  /**
   * Perform comprehensive comparison between submission and base example
   */
  static async compareWithBaseExample(
    submissionContent: string,
    baseExampleContent: string,
    question: {
      title: string
      description: string
      criteria?: string
    },
    submissionType: SubmissionType,
    options: {
      includeDetailedAnalysis?: boolean
      includeInsights?: boolean
      complexity?: LLMComplexity
    } = {}
  ): Promise<EnhancedAssessmentResult> {

    try {
      // Base assessment using existing LLM service
      const baseAssessment = await assessSubmission({
        submissionContent,
        baseExampleContent,
        question,
        submissionType,
        complexity: options.complexity
      })

      // Enhanced detailed analysis if requested
      let detailedComparison: DetailedComparison
      let insights: ComparisonInsights

      if (options.includeDetailedAnalysis) {
        detailedComparison = await this.performDetailedAnalysis(
          submissionContent,
          baseExampleContent,
          question,
          submissionType,
          baseAssessment
        )
      } else {
        // Create simplified analysis from base assessment
        detailedComparison = this.createSimplifiedAnalysis(baseAssessment)
      }

      if (options.includeInsights) {
        insights = await this.generateInsights(
          detailedComparison,
          baseAssessment,
          question
        )
      } else {
        insights = this.createBasicInsights(baseAssessment)
      }

      return {
        score: baseAssessment.score,
        confidence: baseAssessment.confidence,
        feedback: baseAssessment.feedback,
        detailedComparison,
        insights,
        comparisonData: baseAssessment.comparisonData
      }

    } catch (error) {
      console.error('Base example comparison failed:', error)

      return {
        score: 0,
        confidence: 0,
        feedback: 'Comparison analysis failed. Please try again.',
        detailedComparison: this.createEmptyAnalysis(),
        insights: this.createEmptyInsights(),
        comparisonData: {
          similarities: [],
          differences: ['Analysis failed'],
          suggestions: ['Please resubmit for assessment']
        }
      }
    }
  }

  /**
   * Perform detailed structural and content analysis
   */
  private static async performDetailedAnalysis(
    submissionContent: string,
    baseExampleContent: string,
    question: any,
    submissionType: SubmissionType,
    baseAssessment: any
  ): Promise<DetailedComparison> {

    // Create detailed analysis prompt for LLM
    const analysisPrompt = `
You are an expert assessment analyzer. Perform a detailed comparison between a student submission and a perfect base example.

**Question Context:**
${question.title}
${question.description}
${question.criteria ? `Criteria: ${question.criteria}` : ''}

**Base Example (Perfect Answer):**
${baseExampleContent}

**Student Submission:**
${submissionContent}

**Analysis Framework:**
Provide detailed analysis in the following areas:

1. **Structural Analysis**: Compare organization, flow, and format
2. **Content Analysis**: Compare completeness, accuracy, and relevance
3. **Quality Analysis**: Compare depth, clarity, and professionalism
4. **Compliance Analysis**: Compare adherence to requirements and criteria

For each area, provide:
- Numerical score (0-100)
- Specific strengths found in submission
- Specific gaps or areas for improvement
- Missing elements compared to base example

Return analysis as JSON with this exact structure:
{
  "overallSimilarity": <0-100>,
  "structuralAnalysis": {
    "score": <0-100>,
    "strengths": ["specific strength 1", "strength 2"],
    "gaps": ["specific gap 1", "gap 2"]
  },
  "contentAnalysis": {
    "score": <0-100>,
    "similarities": ["similarity 1", "similarity 2"],
    "differences": ["difference 1", "difference 2"],
    "missing_elements": ["missing 1", "missing 2"]
  },
  "qualityAnalysis": {
    "score": <0-100>,
    "strengths": ["quality strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
  },
  "complianceAnalysis": {
    "score": <0-100>,
    "metCriteria": ["met criterion 1", "met criterion 2"],
    "missedCriteria": ["missed criterion 1", "missed criterion 2"]
  }
}
`

    try {
      // For Sprint 2, use simplified analysis based on base assessment
      // In later sprints, this would use enhanced LLM calls
      const overallSimilarity = baseAssessment.score

      return {
        overallSimilarity,
        structuralAnalysis: {
          score: Math.max(0, overallSimilarity - 10),
          strengths: baseAssessment.comparisonData.similarities.slice(0, 2),
          gaps: baseAssessment.comparisonData.differences.slice(0, 2)
        },
        contentAnalysis: {
          score: overallSimilarity,
          similarities: baseAssessment.comparisonData.similarities,
          differences: baseAssessment.comparisonData.differences,
          missing_elements: baseAssessment.comparisonData.differences.filter((d: string) =>
            d.toLowerCase().includes('missing') || d.toLowerCase().includes('lacks')
          )
        },
        qualityAnalysis: {
          score: Math.min(100, overallSimilarity + 5),
          strengths: baseAssessment.comparisonData.similarities.filter((s: string) =>
            s.toLowerCase().includes('good') || s.toLowerCase().includes('correct')
          ),
          improvements: baseAssessment.comparisonData.suggestions.slice(0, 3)
        },
        complianceAnalysis: {
          score: overallSimilarity,
          metCriteria: baseAssessment.comparisonData.similarities,
          missedCriteria: baseAssessment.comparisonData.differences
        }
      }

    } catch (error) {
      console.error('Detailed analysis failed:', error)
      return this.createSimplifiedAnalysis(baseAssessment)
    }
  }

  /**
   * Generate actionable insights from comparison analysis
   */
  private static async generateInsights(
    detailedComparison: DetailedComparison,
    baseAssessment: any,
    question: any
  ): Promise<ComparisonInsights> {

    try {
      // Extract key strengths from all analysis areas
      const keyStrengths = [
        ...detailedComparison.structuralAnalysis.strengths,
        ...detailedComparison.qualityAnalysis.strengths.slice(0, 2)
      ].slice(0, 4)

      // Extract critical gaps
      const criticalGaps = [
        ...detailedComparison.contentAnalysis.missing_elements,
        ...detailedComparison.structuralAnalysis.gaps
      ].slice(0, 3)

      // Prioritize improvements based on scores
      const improvementPriority = []

      if (detailedComparison.structuralAnalysis.score < 70) {
        improvementPriority.push({
          area: 'Structure and Organization',
          impact: 'high' as const,
          suggestions: detailedComparison.structuralAnalysis.gaps.slice(0, 2)
        })
      }

      if (detailedComparison.contentAnalysis.score < 70) {
        improvementPriority.push({
          area: 'Content Completeness',
          impact: 'high' as const,
          suggestions: detailedComparison.contentAnalysis.missing_elements.slice(0, 2)
        })
      }

      if (detailedComparison.qualityAnalysis.score < 80) {
        improvementPriority.push({
          area: 'Quality and Clarity',
          impact: 'medium' as const,
          suggestions: detailedComparison.qualityAnalysis.improvements.slice(0, 2)
        })
      }

      // Generate next steps
      const nextSteps = [
        ...baseAssessment.comparisonData.suggestions.slice(0, 2),
        'Review the base example for reference',
        'Focus on the highest impact improvements first'
      ].slice(0, 4)

      return {
        keyStrengths,
        criticalGaps,
        improvementPriority,
        nextSteps
      }

    } catch (error) {
      console.error('Insights generation failed:', error)
      return this.createBasicInsights(baseAssessment)
    }
  }

  /**
   * Helper methods for fallback scenarios
   */
  private static createSimplifiedAnalysis(baseAssessment: any): DetailedComparison {
    const score = baseAssessment.score

    return {
      overallSimilarity: score,
      structuralAnalysis: {
        score: score,
        strengths: baseAssessment.comparisonData.similarities.slice(0, 2),
        gaps: baseAssessment.comparisonData.differences.slice(0, 2)
      },
      contentAnalysis: {
        score: score,
        similarities: baseAssessment.comparisonData.similarities,
        differences: baseAssessment.comparisonData.differences,
        missing_elements: []
      },
      qualityAnalysis: {
        score: score,
        strengths: baseAssessment.comparisonData.similarities.slice(0, 2),
        improvements: baseAssessment.comparisonData.suggestions.slice(0, 2)
      },
      complianceAnalysis: {
        score: score,
        metCriteria: baseAssessment.comparisonData.similarities,
        missedCriteria: baseAssessment.comparisonData.differences
      }
    }
  }

  private static createBasicInsights(baseAssessment: any): ComparisonInsights {
    return {
      keyStrengths: baseAssessment.comparisonData.similarities.slice(0, 3),
      criticalGaps: baseAssessment.comparisonData.differences.slice(0, 3),
      improvementPriority: [{
        area: 'General Improvements',
        impact: 'medium' as const,
        suggestions: baseAssessment.comparisonData.suggestions.slice(0, 2)
      }],
      nextSteps: baseAssessment.comparisonData.suggestions.slice(0, 3)
    }
  }

  private static createEmptyAnalysis(): DetailedComparison {
    return {
      overallSimilarity: 0,
      structuralAnalysis: { score: 0, strengths: [], gaps: ['Analysis failed'] },
      contentAnalysis: { score: 0, similarities: [], differences: ['Analysis failed'], missing_elements: [] },
      qualityAnalysis: { score: 0, strengths: [], improvements: ['Please resubmit'] },
      complianceAnalysis: { score: 0, metCriteria: [], missedCriteria: ['Analysis failed'] }
    }
  }

  private static createEmptyInsights(): ComparisonInsights {
    return {
      keyStrengths: [],
      criticalGaps: ['Analysis failed'],
      improvementPriority: [],
      nextSteps: ['Please contact support']
    }
  }
}

// Convenience functions
export async function performDetailedComparison(
  submissionContent: string,
  baseExampleContent: string,
  question: { title: string; description: string; criteria?: string },
  submissionType: SubmissionType
) {
  return BaseExampleComparisonEngine.compareWithBaseExample(
    submissionContent,
    baseExampleContent,
    question,
    submissionType,
    { includeDetailedAnalysis: true, includeInsights: true }
  )
}

export async function performBasicComparison(
  submissionContent: string,
  baseExampleContent: string,
  question: { title: string; description: string; criteria?: string },
  submissionType: SubmissionType
) {
  return BaseExampleComparisonEngine.compareWithBaseExample(
    submissionContent,
    baseExampleContent,
    question,
    submissionType,
    { includeDetailedAnalysis: false, includeInsights: false }
  )
}