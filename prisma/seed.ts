import { PrismaClient, Role, SubmissionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      name: 'Super Administrator',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  })

  const courseAdmin1 = await prisma.user.upsert({
    where: { email: 'admin1@example.com' },
    update: {},
    create: {
      email: 'admin1@example.com',
      name: 'Course Admin 1',
      password: hashedPassword,
      role: Role.COURSE_ADMIN,
    },
  })

  const courseAdmin2 = await prisma.user.upsert({
    where: { email: 'admin2@example.com' },
    update: {},
    create: {
      email: 'admin2@example.com',
      name: 'Course Admin 2',
      password: hashedPassword,
      role: Role.COURSE_ADMIN,
    },
  })

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      name: 'Student One',
      password: hashedPassword,
      role: Role.STUDENT,
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      name: 'Student Two',
      password: hashedPassword,
      role: Role.STUDENT,
    },
  })

  console.log('👥 Created users')

  // Create courses
  const jsBasicsCourse = await prisma.course.upsert({
    where: { id: 'js-basics-course' },
    update: {},
    create: {
      id: 'js-basics-course',
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming language',
      adminId: courseAdmin1.id,
      createdById: superAdmin.id,
      isActive: true,
    },
  })

  const webDevCourse = await prisma.course.upsert({
    where: { id: 'web-dev-course' },
    update: {},
    create: {
      id: 'web-dev-course',
      title: 'Full Stack Web Development',
      description: 'Build complete web applications with modern technologies',
      adminId: courseAdmin2.id,
      createdById: superAdmin.id,
      isActive: true,
    },
  })

  const reactCourse = await prisma.course.upsert({
    where: { id: 'react-course' },
    update: {},
    create: {
      id: 'react-course',
      title: 'React Development',
      description: 'Master React framework for building user interfaces',
      adminId: courseAdmin1.id,
      createdById: courseAdmin1.id,
      isActive: true,
    },
  })

  console.log('📚 Created courses')

  // Create course enrollments
  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: jsBasicsCourse.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      courseId: jsBasicsCourse.id,
      studentId: student1.id,
    },
  })

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: jsBasicsCourse.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      courseId: jsBasicsCourse.id,
      studentId: student2.id,
    },
  })

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: webDevCourse.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      studentId: student1.id,
    },
  })

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: reactCourse.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      courseId: reactCourse.id,
      studentId: student2.id,
    },
  })

  console.log('🎓 Created course enrollments')

  // Create questions with base examples
  const jsVariablesQuestion = await prisma.question.upsert({
    where: { id: 'js-variables-question' },
    update: {},
    create: {
      id: 'js-variables-question',
      title: 'JavaScript Variables Assignment',
      description: 'Create a simple program that demonstrates variable declaration and assignment in JavaScript. Include examples of let, const, and var.',
      submissionType: SubmissionType.TEXT,
      criteria: 'Code should demonstrate proper variable usage, include comments, and show understanding of scope differences.',
      courseId: jsBasicsCourse.id,
      createdById: courseAdmin1.id,
      isActive: true,
    },
  })

  await prisma.baseExample.upsert({
    where: { questionId: jsVariablesQuestion.id },
    update: {},
    create: {
      questionId: jsVariablesQuestion.id,
      content: `// Perfect example of JavaScript variables
// Using let for variables that will change
let userName = "John Doe";
let userAge = 25;

// Using const for constants
const PI = 3.14159;
const COMPANY_NAME = "TechCorp";

// Demonstrating scope
function demonstrateScope() {
  let localVariable = "I'm local";
  console.log(localVariable); // Accessible here

  if (true) {
    let blockScoped = "I'm block scoped";
    console.log(blockScoped); // Accessible here
  }
  // console.log(blockScoped); // Would cause error
}

// Updating variables
userName = "Jane Smith"; // Valid - let allows reassignment
userAge = 26;

// PI = 3.14; // Would cause error - const cannot be reassigned

console.log(\`User: \${userName}, Age: \${userAge}\`);
console.log(\`Company: \${COMPANY_NAME}\`);

demonstrateScope();`,
      type: SubmissionType.TEXT,
      metadata: {
        keyPoints: [
          "Proper use of let for reassignable variables",
          "Proper use of const for constants",
          "Good variable naming conventions",
          "Demonstration of scope",
          "Helpful comments explaining concepts"
        ]
      },
    },
  })

  const webProjectQuestion = await prisma.question.upsert({
    where: { id: 'web-project-question' },
    update: {},
    create: {
      id: 'web-project-question',
      title: 'Portfolio Website',
      description: 'Create a personal portfolio website that showcases your skills and projects. The website should be responsive and include modern web development practices.',
      submissionType: SubmissionType.WEBSITE,
      criteria: 'Website should be responsive, accessible, use semantic HTML, and have a professional appearance.',
      courseId: webDevCourse.id,
      createdById: courseAdmin2.id,
      isActive: true,
    },
  })

  await prisma.baseExample.upsert({
    where: { questionId: webProjectQuestion.id },
    update: {},
    create: {
      questionId: webProjectQuestion.id,
      content: 'https://example-portfolio.vercel.app',
      type: SubmissionType.WEBSITE,
      metadata: {
        requirements: [
          "Responsive design that works on mobile and desktop",
          "Clean, professional layout",
          "About section with bio",
          "Projects/portfolio section",
          "Contact information",
          "Semantic HTML structure",
          "CSS Grid or Flexbox for layout",
          "Accessible design (alt tags, proper headings, etc.)"
        ],
        technicalCriteria: [
          "Valid HTML5",
          "Modern CSS (Grid/Flexbox)",
          "Mobile-first responsive design",
          "Fast loading times",
          "SEO-friendly structure"
        ]
      },
    },
  })

  const reactComponentQuestion = await prisma.question.upsert({
    where: { id: 'react-component-question' },
    update: {},
    create: {
      id: 'react-component-question',
      title: 'React Todo Application',
      description: 'Build a complete todo application using React. Include functionality to add, edit, delete, and mark todos as complete.',
      submissionType: SubmissionType.GITHUB_REPO,
      criteria: 'Application should use modern React patterns, include proper state management, and have a clean component structure.',
      courseId: reactCourse.id,
      createdById: courseAdmin1.id,
      isActive: true,
    },
  })

  await prisma.baseExample.upsert({
    where: { questionId: reactComponentQuestion.id },
    update: {},
    create: {
      questionId: reactComponentQuestion.id,
      content: 'https://github.com/example/react-todo-perfect',
      type: SubmissionType.GITHUB_REPO,
      metadata: {
        expectedFeatures: [
          "Add new todos",
          "Mark todos as complete/incomplete",
          "Edit existing todos",
          "Delete todos",
          "Filter todos (all, active, completed)",
          "Persist data (localStorage or backend)"
        ],
        technicalRequirements: [
          "Functional components with hooks",
          "Proper state management (useState, useEffect)",
          "Component composition",
          "Clean, readable code",
          "PropTypes or TypeScript",
          "Responsive design",
          "Error handling"
        ],
        codeQuality: [
          "Proper file organization",
          "Meaningful component and variable names",
          "Comments for complex logic",
          "Consistent code style",
          "No console errors"
        ]
      },
    },
  })

  console.log('❓ Created questions with base examples')

  // Create sample submissions
  await prisma.submission.upsert({
    where: { id: 'sample-submission-1' },
    update: {},
    create: {
      id: 'sample-submission-1',
      content: `// My attempt at JavaScript variables
var name = "John";
var age = 30;

console.log("Name: " + name);
console.log("Age: " + age);`,
      questionId: jsVariablesQuestion.id,
      studentId: student1.id,
      status: 'COMPLETED',
      score: 6.5,
      feedback: 'Good basic understanding, but consider using let/const instead of var for better scope control. Also missing demonstration of different variable types and scope concepts.',
      confidence: 0.85,
      comparisonData: {
        similarities: ["Basic variable declaration", "Console output"],
        differences: ["Uses var instead of let/const", "Missing scope demonstration", "No comments explaining concepts"],
        suggestions: ["Use let for reassignable variables", "Use const for constants", "Add comments to explain concepts", "Demonstrate block scope"]
      },
    },
  })

  console.log('📝 Created sample submissions')

  console.log('✅ Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })