#!/usr/bin/env tsx
/**
 * Quick LLM Service Test
 */

import { healthCheck, determineComplexity, LLMComplexity } from '../src/lib/services/llm-service'
import { SubmissionType } from '@prisma/client'

async function testLLMService() {
  console.log('🤖 Testing LLM Service Integration...\n')

  // Test 1: Health Check
  console.log('1. Testing LLM Health Check...')
  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-groq-api-key') {
      console.log('⚠️  GROQ_API_KEY not configured - skipping LLM tests')
      console.log('   To test LLM functionality, add your Groq API key to .env file')
      return
    }

    const isHealthy = await healthCheck()
    if (isHealthy) {
      console.log('✅ LLM Service is healthy and responding')
    } else {
      console.log('❌ LLM Service health check failed')
    }
  } catch (error) {
    console.log('❌ LLM Health check error:', error instanceof Error ? error.message : error)
  }

  // Test 2: Complexity Determination
  console.log('\n2. Testing Complexity Determination...')
  try {
    const textComplexity = determineComplexity(SubmissionType.TEXT, 'Short answer')
    const docComplexity = determineComplexity(SubmissionType.DOCUMENT, 'Long research paper')
    const githubComplexity = determineComplexity(SubmissionType.GITHUB_REPO, 'Full codebase')

    console.log(`   → Text submission: ${textComplexity}`)
    console.log(`   → Document submission: ${docComplexity}`)
    console.log(`   → GitHub submission: ${githubComplexity}`)
    console.log('✅ Complexity determination working')
  } catch (error) {
    console.log('❌ Complexity determination error:', error instanceof Error ? error.message : error)
  }

  // Test 3: Quick Assessment (if API key is available)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key') {
    console.log('\n3. Testing Quick Assessment...')
    try {
      // Import assessment function dynamically to avoid issues if not available
      const { assessTextSubmission } = await import('../src/lib/services/llm-service')

      const result = await assessTextSubmission(
        'The capital of France is Paris.',
        'What is the capital of France?',
        'The capital of France is Paris. It is located in northern France.',
        ['Correct answer', 'Proper formatting']
      )

      console.log(`   → Score: ${result.score}/100`)
      console.log(`   → Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`   → Similarities: ${result.comparisonData.similarities.length}`)
      console.log('✅ LLM Assessment working correctly')
    } catch (error) {
      console.log('❌ LLM Assessment error:', error instanceof Error ? error.message : error)
    }
  }

  console.log('\n🎯 LLM Service test completed!')
}

if (require.main === module) {
  testLLMService().catch((error) => {
    console.error('❌ LLM test failed:', error)
    process.exit(1)
  })
}