#!/usr/bin/env tsx
/**
 * Quick script to create test admin users for Sprint 3 interface testing
 */

import { prisma } from '../src/lib/db'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function seedAdminUsers() {
  console.log('🌱 Creating test admin users for Sprint 3...\n')

  try {
    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@assessment.local' },
      update: {},
      create: {
        email: 'superadmin@assessment.local',
        name: 'Super Administrator',
        hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true
      }
    })

    // Create Course Admin
    const courseAdmin = await prisma.user.upsert({
      where: { email: 'courseadmin@assessment.local' },
      update: {},
      create: {
        email: 'courseadmin@assessment.local',
        name: 'Course Administrator',
        hashedPassword,
        role: UserRole.COURSE_ADMIN,
        isActive: true
      }
    })

    // Create Student
    const student = await prisma.user.upsert({
      where: { email: 'student@assessment.local' },
      update: {},
      create: {
        email: 'student@assessment.local',
        name: 'Test Student',
        hashedPassword,
        role: UserRole.STUDENT,
        isActive: true
      }
    })

    // Create a test course
    const course = await prisma.course.upsert({
      where: { name: 'Sprint 3 Test Course' },
      update: {},
      create: {
        name: 'Sprint 3 Test Course',
        description: 'A test course for demonstrating the admin interface functionality',
        createdBy: courseAdmin.id,
        isActive: true
      }
    })

    // Create a test question
    const question = await prisma.question.create({
      data: {
        courseId: course.id,
        questionNumber: 1,
        title: 'Test Assessment Question',
        description: 'Describe your understanding of React components',
        submissionType: 'TEXT',
        assessmentPrompt: 'Evaluate the student response for understanding of React components',
        criteria: ['Understanding of components', 'Clear explanation', 'Examples provided'],
        createdBy: courseAdmin.id
      }
    })

    // Create a base example
    await prisma.baseExample.create({
      data: {
        questionId: question.id,
        title: 'Perfect Answer Example',
        description: 'An exemplary response about React components',
        content: 'React components are reusable pieces of UI that encapsulate logic and presentation. They can be function components or class components, accept props as input, and return JSX elements. Components help create modular, maintainable applications.',
        contentType: 'TEXT',
        createdBy: courseAdmin.id
      }
    })

    console.log('✅ Test users created successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('┌─────────────────┬─────────────────────────────────┬─────────────┐')
    console.log('│ Role            │ Email                           │ Password    │')
    console.log('├─────────────────┼─────────────────────────────────┼─────────────┤')
    console.log('│ Super Admin     │ superadmin@assessment.local     │ admin123    │')
    console.log('│ Course Admin    │ courseadmin@assessment.local    │ admin123    │')
    console.log('│ Student         │ student@assessment.local        │ admin123    │')
    console.log('└─────────────────┴─────────────────────────────────┴─────────────┘')
    console.log('\n🚀 You can now test the admin interface!')
    console.log('   Navigate to: http://localhost:3004/admin')

  } catch (error) {
    console.error('❌ Error creating test users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedAdminUsers()
}