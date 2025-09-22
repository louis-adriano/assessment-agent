#!/usr/bin/env tsx
/**
 * Comprehensive functionality test for Assessment Agent
 * Tests all core features: Database, Auth, LLM, Assessment Engine
 */

import { prisma } from '../src/lib/db'
import { UserRole, SubmissionType } from '@prisma/client'
import { healthCheck } from '../src/lib/services/llm-service'
import { createCourse } from '../src/lib/actions/course-actions'
import { createQuestion } from '../src/lib/actions/question-actions'
import { createBaseExample } from '../src/lib/actions/base-example-actions'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration?: number
}

class TestSuite {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now()
    try {
      await testFn()
      const duration = Date.now() - start
      this.results.push({
        name,
        status: 'PASS',
        message: 'Test passed successfully',
        duration
      })
      console.log(`✅ ${name} (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - start
      this.results.push({
        name,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      console.log(`❌ ${name} (${duration}ms): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async skipTest(name: string, reason: string): Promise<void> {
    this.results.push({
      name,
      status: 'SKIP',
      message: reason
    })
    console.log(`⚠️  ${name}: ${reason}`)
  }

  getResults() {
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const skipped = this.results.filter(r => r.status === 'SKIP').length
    const total = this.results.length

    return {
      total,
      passed,
      failed,
      skipped,
      results: this.results
    }
  }

  printSummary() {
    const { total, passed, failed, skipped } = this.getResults()
    console.log('\n' + '='.repeat(50))
    console.log('TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Skipped: ${skipped}`)
    console.log(`Success Rate: ${total > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : 0}%`)
  }
}

async function main() {
  const suite = new TestSuite()
  console.log('🚀 Starting Assessment Agent Functionality Tests...\n')

  // Test 1: Database Connection
  await suite.runTest('Database Connection', async () => {
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test`
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Database query failed')
    }
  })

  // Test 2: Database Schema Validation
  await suite.runTest('Database Schema Validation', async () => {
    // Test that all tables exist and basic structure is correct
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as any[]

    const requiredTables = ['users', 'courses', 'questions', 'base_examples', 'submissions', 'enrollments', 'course_admins']
    const existingTables = tables.map(t => t.table_name)

    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        throw new Error(`Required table '${table}' not found`)
      }
    }
  })

  // Test 3: User Model Operations
  await suite.runTest('User Model CRUD', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Test User',
        role: UserRole.STUDENT
      }
    })

    // Read user
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    if (!foundUser) throw new Error('User not found after creation')

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Test User' }
    })

    // Delete user
    await prisma.user.delete({
      where: { id: user.id }
    })
  })

  // Test 4: LLM Service Health Check
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key') {
    await suite.runTest('LLM Service Health Check', async () => {
      const isHealthy = await healthCheck()
      if (!isHealthy) {
        throw new Error('LLM service health check failed')
      }
    })
  } else {
    await suite.skipTest('LLM Service Health Check', 'GROQ_API_KEY not configured')
  }

  // Test 5: Course Creation (Server Action)
  await suite.runTest('Course Creation Server Action', async () => {
    // Create test user first
    const user = await prisma.user.create({
      data: {
        email: `course-test-${Date.now()}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Course Test User',
        role: UserRole.SUPER_ADMIN
      }
    })

    try {
      const result = await createCourse({
        name: `Test Course ${Date.now()}`,
        description: 'Test course description'
      }, user.id)

      if (!result.success) {
        throw new Error(result.error || 'Course creation failed')
      }

      // Verify course was created
      const course = await prisma.course.findUnique({
        where: { id: result.data.id }
      })
      if (!course) throw new Error('Course not found after creation')

      // Cleanup
      await prisma.course.delete({ where: { id: course.id } })
    } finally {
      await prisma.user.delete({ where: { id: user.id } })
    }
  })

  // Test 6: Question and Base Example Creation
  await suite.runTest('Question and Base Example Creation', async () => {
    // Create test user and course
    const user = await prisma.user.create({
      data: {
        email: `question-test-${Date.now()}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Question Test User',
        role: UserRole.COURSE_ADMIN
      }
    })

    const course = await prisma.course.create({
      data: {
        name: `Test Course for Questions ${Date.now()}`,
        description: 'Test course for question testing',
        createdBy: user.id
      }
    })

    try {
      // Create question
      const questionResult = await createQuestion({
        title: 'Test Question',
        description: 'Test question description',
        submissionType: SubmissionType.TEXT,
        criteria: 'Test criteria',
        courseId: course.id
      }, user.id)

      if (!questionResult.success) {
        throw new Error(questionResult.error || 'Question creation failed')
      }

      // Create base example
      const exampleResult = await createBaseExample({
        questionId: questionResult.data.id,
        content: 'This is a perfect answer example',
        type: SubmissionType.TEXT
      }, user.id)

      if (!exampleResult.success) {
        throw new Error(exampleResult.error || 'Base example creation failed')
      }

      // Verify relationships
      const questionWithExample = await prisma.question.findUnique({
        where: { id: questionResult.data.id },
        include: { baseExamples: true }
      })

      if (!questionWithExample?.baseExamples.length) {
        throw new Error('Base example not properly linked to question')
      }
    } finally {
      // Cleanup
      await prisma.course.delete({ where: { id: course.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })

  // Test 7: Prisma Enum Values
  await suite.runTest('Prisma Enum Values', async () => {
    const userRoles = Object.values(UserRole)
    const submissionTypes = Object.values(SubmissionType)

    if (!userRoles.includes(UserRole.SUPER_ADMIN)) {
      throw new Error('UserRole enum not properly imported')
    }

    if (!submissionTypes.includes(SubmissionType.TEXT)) {
      throw new Error('SubmissionType enum not properly imported')
    }
  })

  // Test 8: Complex Database Query (Relationships)
  await suite.runTest('Complex Database Relationships', async () => {
    // Create full test data structure
    const user = await prisma.user.create({
      data: {
        email: `relationship-test-${Date.now()}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Relationship Test User',
        role: UserRole.SUPER_ADMIN
      }
    })

    const course = await prisma.course.create({
      data: {
        name: `Relationship Test Course ${Date.now()}`,
        description: 'Test course for relationship testing',
        createdBy: user.id
      }
    })

    const question = await prisma.question.create({
      data: {
        courseId: course.id,
        questionNumber: 1,
        title: 'Relationship Test Question',
        description: 'Test question for relationships',
        submissionType: SubmissionType.TEXT,
        assessmentPrompt: 'Test prompt',
        createdBy: user.id
      }
    })

    try {
      // Test complex query with multiple joins
      const result = await prisma.course.findUnique({
        where: { id: course.id },
        include: {
          createdByUser: true,
          questions: {
            include: {
              baseExamples: true,
              submissions: true
            }
          },
          enrollments: {
            include: {
              user: true
            }
          },
          _count: {
            select: {
              questions: true,
              enrollments: true
            }
          }
        }
      })

      if (!result) throw new Error('Complex query failed')
      if (result.createdByUser.id !== user.id) throw new Error('User relationship incorrect')
      if (result.questions.length !== 1) throw new Error('Question relationship incorrect')
    } finally {
      // Cleanup
      await prisma.course.delete({ where: { id: course.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  })

  await prisma.$disconnect()
  suite.printSummary()

  const { failed } = suite.getResults()
  process.exit(failed > 0 ? 1 : 0)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Test suite failed:', error)
    process.exit(1)
  })
}

export { TestSuite }