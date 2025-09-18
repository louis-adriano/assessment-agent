import { createOpenAI } from '@ai-sdk/openai'
import { generateText, generateObject } from 'ai'
import { z } from 'zod'
import { SubmissionType } from '@prisma/client'

// LLM Configuration
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

// Assessment result schema
const assessmentSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
  confidence: z.number().min(0).max(1),
  comparisonData: z.object({
    similarities: z.array(z.string()),
    differences: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
})

export type AssessmentResult = z.infer<typeof assessmentSchema>

// LLM Model Selection based on complexity
export enum LLMComplexity {
  BASIC = 'basic',
  STANDARD = 'standard', 
  COMPLEX = 'complex',
  AGENTIC = 'agentic'
}

// Model mapping based on complexity
const getModelForComplexity = (complexity: LLMComplexity): string => {
  switch (complexity) {
    case LLMComplexity.BASIC:
      return 'llama-3.1-8b-instant' // Llama 8B for basic tasks
    case LLMComplexity.STANDARD:
      return 'llama-3.1-70b-versatile' // Llama 70B for standard tasks
    case LLMComplexity.COMPLEX:
      return 'llama-3.1-70b-versatile' // Llama 70B for complex analysis
    case LLMComplexity.AGENTIC:
      return 'llama-3.1-70b-versatile' // Llama 70B for agentic operations
    default:
      return 'llama-3.1-8b-instant'
  }
}

// Determine complexity based on submission type and content
export const determineComplexity = (
  submissionType: SubmissionType,
  contentLength?: number,
  hasCodeAnalysis?: boolean
): LLMComplexity => {
  switch (submissionType) {
    case SubmissionType.TEXT:
      // Basic for short text, standard for long text
      return (contentLength && contentLength > 1000) 
        ? LLMComplexity.STANDARD 
        : LLMComplexity.BASIC
    
    case SubmissionType.DOCUMENT:
      // Standard for documents, complex for very long documents
      return (contentLength && contentLength > 5000)
        ? LLMComplexity.COMPLEX
        : LLMComplexity.STANDARD
    
    case SubmissionType.WEBSITE:
      // Standard for websites, complex if detailed analysis needed
      return LLMComplexity.STANDARD
    
    case SubmissionType.GITHUB_REPO:
      // Always agentic for GitHub repositories
      return LLMComplexity.AGENTIC
    
    default:
      return LLMComplexity.BASIC
  }
}

// Main assessment function with base example comparison
export async function assessSubmission({
  submissionContent,
  baseExampleContent,
  question,
  submissionType,
  complexity,
}: {
  submissionContent: string
  baseExampleContent: string
  question: {
    title: string
    description: string
    criteria?: string
  }
  submissionType: SubmissionType
  complexity?: LLMComplexity
}): Promise<AssessmentResult> {
  
  const selectedComplexity = complexity || determineComplexity(
    submissionType, 
    submissionContent.length
  )
  
  const model = groq(getModelForComplexity(selectedComplexity))

  const prompt = `You are an expert assessment evaluator. Your task is to assess a student submission against a base example (perfect answer).

**Question Details:**
Title: ${question.title}
Description: ${question.description}
${question.criteria ? `Assessment Criteria: ${question.criteria}` : ''}
Submission Type: ${submissionType}

**Base Example (Perfect Answer):**
${baseExampleContent}

**Student Submission:**
${submissionContent}

**Assessment Instructions:**
1. Compare the submission against the base example thoroughly
2. Identify specific similarities and differences
3. Provide a score from 0-100 based on how well it matches the base example
4. Give constructive feedback explaining the score
5. Provide your confidence level (0-1) in this assessment
6. Suggest specific improvements to match the base example better

Focus on:
- Content accuracy and completeness compared to base example
- Structure and organization similarity
- Quality of implementation/execution
- Adherence to requirements outlined in the base example
- Areas where the submission deviates from the perfect answer

Provide specific, actionable feedback that helps the student understand the gaps.`

  try {
    const result = await generateObject({
      model,
      schema: assessmentSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent assessments
    })

    return result.object
  } catch (error) {
    console.error('LLM Assessment Error:', error)
    
    // Fallback assessment
    return {
      score: 50,
      feedback: 'Assessment temporarily unavailable. Please try again later.',
      confidence: 0.1,
      comparisonData: {
        similarities: ['Unable to analyze'],
        differences: ['Assessment service temporarily unavailable'],
        suggestions: ['Please resubmit for assessment'],
      },
    }
  }
}

// Specialized assessment for different submission types
export async function assessTextSubmission(
  submission: string,
  baseExample: string,
  question: { title: string; description: string; criteria?: string }
): Promise<AssessmentResult> {
  return assessSubmission({
    submissionContent: submission,
    baseExampleContent: baseExample,
    question,
    submissionType: SubmissionType.TEXT,
    complexity: LLMComplexity.BASIC,
  })
}

export async function assessDocumentSubmission(
  documentContent: string,
  baseExample: string,
  question: { title: string; description: string; criteria?: string }
): Promise<AssessmentResult> {
  const complexity = documentContent.length > 5000 
    ? LLMComplexity.COMPLEX 
    : LLMComplexity.STANDARD

  return assessSubmission({
    submissionContent: documentContent,
    baseExampleContent: baseExample,
    question,
    submissionType: SubmissionType.DOCUMENT,
    complexity,
  })
}

export async function assessWebsiteSubmission(
  websiteData: string,
  baseExample: string,
  question: { title: string; description: string; criteria?: string }
): Promise<AssessmentResult> {
  return assessSubmission({
    submissionContent: websiteData,
    baseExampleContent: baseExample,
    question,
    submissionType: SubmissionType.WEBSITE,
    complexity: LLMComplexity.STANDARD,
  })
}

// GitHub assessment will use agentic approach (implemented in Sprint 5)
export async function assessGitHubSubmission(
  repoData: string,
  baseExample: string,
  question: { title: string; description: string; criteria?: string }
): Promise<AssessmentResult> {
  return assessSubmission({
    submissionContent: repoData,
    baseExampleContent: baseExample,
    question,
    submissionType: SubmissionType.GITHUB_REPO,
    complexity: LLMComplexity.AGENTIC,
  })
}

// Utility function to generate summary (basic complexity)
export async function generateSummary(content: string): Promise<string> {
  const model = groq(getModelForComplexity(LLMComplexity.BASIC))
  
  try {
    const result = await generateText({
      model,
      prompt: `Provide a concise summary of the following content:\n\n${content}`,
      maxTokens: 200,
      temperature: 0.5,
    })
    
    return result.text
  } catch (error) {
    console.error('Summary generation error:', error)
    return 'Summary generation temporarily unavailable.'
  }
}

// Health check for LLM service
export async function healthCheck(): Promise<boolean> {
  try {
    const model = groq(getModelForComplexity(LLMComplexity.BASIC))
    
    await generateText({
      model,
      prompt: 'Say "healthy" if you can respond.',
      maxTokens: 10,
    })
    
    return true
  } catch (error) {
    console.error('LLM Health check failed:', error)
    return false
  }
}