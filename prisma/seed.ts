import { PrismaClient, Role, SubmissionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create SuperAdmin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@assessment-agent.com' },
    update: {},
    create: {
      email: 'admin@assessment-agent.com',
      name: 'Super Administrator',
      role: Role.SUPER_ADMIN,
    },
  })
  console.log('✅ Created SuperAdmin:', superAdmin.email)

  // Create CourseAdmin user
  const courseAdmin = await prisma.user.upsert({
    where: { email: 'instructor@assessment-agent.com' },
    update: {},
    create: {
      email: 'instructor@assessment-agent.com',
      name: 'Course Instructor',
      role: Role.COURSE_ADMIN,
    },
  })
  console.log('✅ Created CourseAdmin:', courseAdmin.email)

  // Create Student users
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@assessment-agent.com' },
    update: {},
    create: {
      email: 'student1@assessment-agent.com',
      name: 'Alice Johnson',
      role: Role.STUDENT,
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@assessment-agent.com' },
    update: {},
    create: {
      email: 'student2@assessment-agent.com',
      name: 'Bob Smith',
      role: Role.STUDENT,
    },
  })
  console.log('✅ Created Students:', student1.email, student2.email)

  // Create sample courses
  const webDevCourse = await prisma.course.upsert({
    where: { id: 'course-web-dev-101' },
    update: {},
    create: {
      id: 'course-web-dev-101',
      title: 'Web Development Fundamentals',
      description: 'Learn the basics of HTML, CSS, JavaScript, and modern web development frameworks.',
      adminId: courseAdmin.id,
      createdById: superAdmin.id,
    },
  })

  const aiCourse = await prisma.course.upsert({
    where: { id: 'course-ai-basics-101' },
    update: {},
    create: {
      id: 'course-ai-basics-101',
      title: 'AI & Machine Learning Basics',
      description: 'Introduction to artificial intelligence, machine learning concepts, and practical applications.',
      adminId: courseAdmin.id,
      createdById: superAdmin.id,
    },
  })
  console.log('✅ Created Courses:', webDevCourse.title, aiCourse.title)

  // Enroll students in courses
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
        courseId: webDevCourse.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      studentId: student2.id,
    },
  })

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: aiCourse.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      courseId: aiCourse.id,
      studentId: student1.id,
    },
  })
  console.log('✅ Created Course Enrollments')

  // Create sample questions
  const htmlQuestion = await prisma.question.upsert({
    where: { id: 'question-html-basics' },
    update: {},
    create: {
      id: 'question-html-basics',
      title: 'HTML Document Structure',
      description: 'Create a complete HTML document with proper structure including doctype, head, and body sections.',
      submissionType: SubmissionType.TEXT,
      criteria: 'Must include proper DOCTYPE, meta tags, title, and semantic HTML elements.',
      courseId: webDevCourse.id,
      createdById: courseAdmin.id,
    },
  })

  const jsQuestion = await prisma.question.upsert({
    where: { id: 'question-js-function' },
    update: {},
    create: {
      id: 'question-js-function',
      title: 'JavaScript Function Implementation',
      description: 'Write a JavaScript function that calculates the factorial of a number using recursion.',
      submissionType: SubmissionType.TEXT,
      criteria: 'Function must use recursion, handle edge cases, and include proper error handling.',
      courseId: webDevCourse.id,
      createdById: courseAdmin.id,
    },
  })

  const reactQuestion = await prisma.question.upsert({
    where: { id: 'question-react-component' },
    update: {},
    create: {
      id: 'question-react-component',
      title: 'React Component Project',
      description: 'Build a React todo application with add, delete, and mark complete functionality.',
      submissionType: SubmissionType.GITHUB_REPO,
      criteria: 'Must use React hooks, proper component structure, and include basic styling.',
      courseId: webDevCourse.id,
      createdById: courseAdmin.id,
    },
  })

  const aiQuestion = await prisma.question.upsert({
    where: { id: 'question-ai-concepts' },
    update: {},
    create: {
      id: 'question-ai-concepts',
      title: 'AI Concepts Essay',
      description: 'Write an essay explaining the difference between supervised and unsupervised learning.',
      submissionType: SubmissionType.DOCUMENT,
      criteria: 'Must be 500-800 words, include examples, and demonstrate clear understanding.',
      courseId: aiCourse.id,
      createdById: courseAdmin.id,
    },
  })
  console.log('✅ Created Questions')

  // Create base examples for questions
  await prisma.baseExample.upsert({
    where: { questionId: htmlQuestion.id },
    update: {},
    create: {
      questionId: htmlQuestion.id,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <meta name="description" content="A well-structured HTML document">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is the main content area.</p>
        </section>
        
        <section id="about">
            <h2>About Section</h2>
            <p>Information about the website.</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>
</body>
</html>`,
      type: SubmissionType.TEXT,
      metadata: {
        criteria: ['Proper DOCTYPE', 'Meta tags', 'Semantic elements', 'Valid structure'],
        points: ['DOCTYPE declaration', 'Head section with meta tags', 'Semantic HTML5 elements', 'Proper nesting']
      },
    },
  })

  await prisma.baseExample.upsert({
    where: { questionId: jsQuestion.id },
    update: {},
    create: {
      questionId: jsQuestion.id,
      content: `function factorial(n) {
    // Input validation
    if (typeof n !== 'number' || !Number.isInteger(n)) {
        throw new Error('Input must be a positive integer');
    }
    
    if (n < 0) {
        throw new Error('Factorial is not defined for negative numbers');
    }
    
    // Base cases
    if (n === 0 || n === 1) {
        return 1;
    }
    
    // Recursive case
    return n * factorial(n - 1);
}

// Example usage:
try {
    console.log(factorial(5)); // 120
    console.log(factorial(0)); // 1
    console.log(factorial(3)); // 6
} catch (error) {
    console.error(error.message);
}`,
      type: SubmissionType.TEXT,
      metadata: {
        criteria: ['Recursion', 'Error handling', 'Base cases', 'Input validation'],
        points: ['Uses recursion properly', 'Handles edge cases', 'Includes error handling', 'Clear and readable code']
      },
    },
  })

  await prisma.baseExample.upsert({
    where: { questionId: aiQuestion.id },
    update: {},
    create: {
      questionId: aiQuestion.id,
      content: `# Supervised vs Unsupervised Learning: A Comprehensive Comparison

## Introduction

Machine learning, a subset of artificial intelligence, encompasses various approaches to enable computers to learn and make decisions from data. Two fundamental paradigms in machine learning are supervised and unsupervised learning, each serving distinct purposes and employing different methodologies.

## Supervised Learning

Supervised learning is a machine learning approach where algorithms learn from labeled training data. In this paradigm, both input features and corresponding correct outputs (labels) are provided during the training process.

### Key Characteristics:
- **Labeled Data**: Requires datasets with known correct answers
- **Goal-Oriented**: Aims to predict specific outcomes
- **Performance Measurement**: Can be easily evaluated using accuracy metrics

### Examples:
- **Email Spam Detection**: Training on emails labeled as "spam" or "not spam"
- **Image Recognition**: Learning to identify objects in images with labeled examples
- **Medical Diagnosis**: Predicting diseases based on symptoms with known diagnoses

## Unsupervised Learning

Unsupervised learning operates on data without labeled outcomes, seeking to discover hidden patterns, structures, or relationships within the dataset.

### Key Characteristics:
- **Unlabeled Data**: Works with raw data without predetermined answers
- **Pattern Discovery**: Identifies hidden structures and relationships
- **Exploratory Nature**: Used for data exploration and insight generation

### Examples:
- **Customer Segmentation**: Grouping customers based on purchasing behavior
- **Anomaly Detection**: Identifying unusual patterns in network traffic
- **Market Basket Analysis**: Discovering product associations in retail data

## Conclusion

Both supervised and unsupervised learning play crucial roles in modern AI applications. Supervised learning excels when clear objectives and labeled data are available, while unsupervised learning proves invaluable for exploratory analysis and pattern discovery in unlabeled datasets. Understanding these differences enables practitioners to select the most appropriate approach for their specific use cases.`,
      type: SubmissionType.DOCUMENT,
      metadata: {
        criteria: ['Word count 500-800', 'Clear examples', 'Proper structure', 'Technical accuracy'],
        points: ['Comprehensive comparison', 'Real-world examples', 'Clear writing', 'Demonstrates understanding']
      },
    },
  })
  console.log('✅ Created Base Examples')

  console.log('🎉 Database seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('- Users: 4 (1 SuperAdmin, 1 CourseAdmin, 2 Students)')
  console.log('- Courses: 2 (Web Development, AI Basics)')
  console.log('- Questions: 4 (HTML, JavaScript, React, AI Essay)')
  console.log('- Base Examples: 3 (HTML, JavaScript, AI Essay)')
  console.log('- Enrollments: 3 (Students enrolled in courses)')
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