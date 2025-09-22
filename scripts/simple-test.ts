#!/usr/bin/env tsx
/**
 * Simple functionality test for Assessment Agent
 * Tests core database operations without server actions (due to auth requirements)
 */

import { prisma } from '../src/lib/db'
import { UserRole, SubmissionType } from '@prisma/client'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration?: number
}

class SimpleTestSuite {
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

    return { total, passed, failed, skipped, results: this.results }
  }

  printSummary() {
    const { total, passed, failed, skipped } = this.getResults()
    console.log('\n' + '='.repeat(60))
    console.log('🧪 ASSESSMENT AGENT - CORE FUNCTIONALITY TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`📊 Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⚠️  Skipped: ${skipped}`)
    console.log(`🎯 Success Rate: ${total > 0 ? ((passed / (total - skipped)) * 100).toFixed(1) : 0}%`)

    if (failed === 0 && passed > 0) {
      console.log('\n🎉 All tests passed! Your Assessment Agent is ready to go!')
    } else if (failed > 0) {
      console.log('\n🔧 Some tests failed. Check the errors above for troubleshooting.')
    }
  }
}

async function main() {
  const suite = new SimpleTestSuite()
  console.log('🚀 Starting Assessment Agent Core Functionality Tests...\n')

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

  // Test 3: Prisma Enum Values
  await suite.runTest('Prisma Enum Validation', async () => {
    const userRoles = Object.values(UserRole)
    const submissionTypes = Object.values(SubmissionType)

    if (!userRoles.includes(UserRole.SUPER_ADMIN)) {
      throw new Error('UserRole enum not properly imported')
    }

    if (!submissionTypes.includes(SubmissionType.TEXT)) {
      throw new Error('SubmissionType enum not properly imported')
    }

    console.log(`    → UserRoles: ${userRoles.join(', ')}`)
    console.log(`    → SubmissionTypes: ${submissionTypes.join(', ')}`)
  })

  // Test 4: User CRUD Operations
  await suite.runTest('User Model CRUD Operations', async () => {
    const timestamp = Date.now()

    // Create
    const user = await prisma.user.create({
      data: {
        email: `test-${timestamp}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Test User',
        role: UserRole.STUDENT
      }
    })

    // Read
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    if (!foundUser) throw new Error('User not found after creation')

    // Update
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Test User' }
    })
    if (updatedUser.name !== 'Updated Test User') throw new Error('User update failed')

    // Delete
    await prisma.user.delete({
      where: { id: user.id }
    })

    // Verify deletion
    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    if (deletedUser) throw new Error('User not properly deleted')
  })

  // Test 5: Course and Question Relationships
  await suite.runTest('Course-Question Relationship', async () => {
    const timestamp = Date.now()

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: `course-admin-${timestamp}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Course Admin',
        role: UserRole.COURSE_ADMIN
      }
    })

    // Create course
    const course = await prisma.course.create({
      data: {
        name: `Test Course ${timestamp}`,
        description: 'Test course description',
        createdBy: user.id
      }
    })

    // Create question
    const question = await prisma.question.create({
      data: {
        courseId: course.id,
        questionNumber: 1,
        title: 'Test Question',
        description: 'Test question description',
        submissionType: SubmissionType.TEXT,
        assessmentPrompt: 'Test assessment prompt',
        createdBy: user.id
      }
    })

    // Test relationship queries
    const courseWithQuestions = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        questions: true,
        createdByUser: true,
        _count: { select: { questions: true } }
      }
    })

    if (!courseWithQuestions) throw new Error('Course not found')
    if (courseWithQuestions.questions.length !== 1) throw new Error('Question relationship failed')
    if (courseWithQuestions._count.questions !== 1) throw new Error('Question count failed')
    if (courseWithQuestions.createdByUser.id !== user.id) throw new Error('User relationship failed')

    // Cleanup
    await prisma.question.delete({ where: { id: question.id } })
    await prisma.course.delete({ where: { id: course.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  // Test 6: Base Example Creation
  await suite.runTest('Base Example Operations', async () => {
    const timestamp = Date.now()

    // Setup
    const user = await prisma.user.create({
      data: {
        email: `example-admin-${timestamp}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Example Admin',
        role: UserRole.SUPER_ADMIN
      }
    })

    const course = await prisma.course.create({
      data: {
        name: `Example Course ${timestamp}`,
        description: 'Test course for base examples',
        createdBy: user.id
      }
    })

    const question = await prisma.question.create({
      data: {
        courseId: course.id,
        questionNumber: 1,
        title: 'Example Question',
        description: 'Question for base example testing',
        submissionType: SubmissionType.TEXT,
        assessmentPrompt: 'Assessment prompt for examples',
        createdBy: user.id
      }
    })

    // Create base example
    const baseExample = await prisma.baseExample.create({
      data: {
        questionId: question.id,
        title: 'Perfect Answer',
        description: 'This is what a perfect answer looks like',
        content: 'This is the perfect answer content for comparison',
        contentType: 'TEXT',
        createdBy: user.id
      }
    })

    // Test relationships
    const questionWithExample = await prisma.question.findUnique({
      where: { id: question.id },
      include: { baseExamples: true }
    })

    if (!questionWithExample?.baseExamples.length) {
      throw new Error('Base example not properly linked to question')
    }

    // Cleanup
    await prisma.baseExample.delete({ where: { id: baseExample.id } })
    await prisma.question.delete({ where: { id: question.id } })
    await prisma.course.delete({ where: { id: course.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })

  // Test 7: Enrollment System
  await suite.runTest('Student Enrollment System', async () => {
    const timestamp = Date.now()

    // Create users
    const admin = await prisma.user.create({
      data: {
        email: `admin-${timestamp}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Test Admin',
        role: UserRole.COURSE_ADMIN
      }
    })

    const student = await prisma.user.create({
      data: {
        email: `student-${timestamp}@example.com`,
        hashedPassword: 'test-hash',
        name: 'Test Student',
        role: UserRole.STUDENT
      }
    })

    // Create course
    const course = await prisma.course.create({
      data: {
        name: `Enrollment Course ${timestamp}`,
        description: 'Course for enrollment testing',
        createdBy: admin.id
      }
    })

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id
      }
    })

    // Test relationships
    const courseWithEnrollments = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        enrollments: {
          include: { user: true }
        }
      }
    })

    if (!courseWithEnrollments?.enrollments.length) {
      throw new Error('Enrollment not properly created')
    }

    if (courseWithEnrollments.enrollments[0].user.id !== student.id) {
      throw new Error('Enrollment user relationship failed')
    }

    // Cleanup
    await prisma.enrollment.delete({ where: { id: enrollment.id } })
    await prisma.course.delete({ where: { id: course.id } })
    await prisma.user.delete({ where: { id: admin.id } })
    await prisma.user.delete({ where: { id: student.id } })
  })

  // Test 8: Complex Query Performance
  await suite.runTest('Complex Query Performance', async () => {
    const start = Date.now()

    // This tests the database performance with complex joins
    const result = await prisma.course.findMany({
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        questions: {
          include: {
            baseExamples: true,
            _count: { select: { submissions: true } }
          }
        },
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            questions: true,
            enrollments: true
          }
        }
      },
      take: 10
    })

    const queryTime = Date.now() - start

    if (queryTime > 5000) { // 5 seconds
      throw new Error(`Query too slow: ${queryTime}ms`)
    }

    console.log(`    → Query completed in ${queryTime}ms`)
    console.log(`    → Found ${result.length} courses`)
  })

  await prisma.$disconnect()
  suite.printSummary()

  const { failed } = suite.getResults()
  process.exit(failed > 0 ? 1 : 0)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })
}

export { SimpleTestSuite }