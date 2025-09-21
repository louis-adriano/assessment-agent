import { UserRole, SubmissionType, Remark } from '@prisma/client'

export interface User {
  id: string
  email: string
  name?: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  createdByUser?: Pick<User, 'id' | 'name' | 'email'>
  questions?: Question[]
  enrollments?: Enrollment[]
  courseAdmins?: CourseAdmin[]
  _count?: {
    questions: number
    enrollments: number
  }
}

export interface Question {
  id: string
  title: string
  description: string
  submissionType: SubmissionType
  criteria?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  courseId: string
  createdById: string
  course?: Pick<Course, 'id' | 'title'>
  createdBy?: Pick<User, 'id' | 'name' | 'email'>
  baseExample?: BaseExample | null
  submissions?: Submission[]
  _count?: {
    submissions: number
  }
}

export interface BaseExample {
  id: string
  content: string
  type: SubmissionType
  fileUrl?: string | null
  metadata?: any
  createdAt: Date
  updatedAt: Date
  questionId: string
  question?: Pick<Question, 'id' | 'title'>
}

export interface Submission {
  id: string
  content?: string | null
  fileUrl?: string | null
  websiteUrl?: string | null
  githubUrl?: string | null
  status: SubmissionStatus
  submittedAt: Date
  processedAt?: Date | null
  score?: number | null
  feedback?: string | null
  confidence?: number | null
  comparisonData?: any
  questionId: string
  studentId: string
  question?: Question
  student?: Pick<User, 'id' | 'name' | 'email'>
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: Date
  isActive: boolean
  user?: Pick<User, 'id' | 'name' | 'email'>
  course?: Course
}

export interface CourseAdmin {
  id: string
  userId: string
  courseId: string
  createdAt: Date
  user?: Pick<User, 'id' | 'name' | 'email'>
  course?: Course
}

// API Response types
export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Form validation types
export interface CreateCourseData {
  name: string
  description: string
}

export interface UpdateCourseData {
  id: string
  name?: string
  description?: string
  isActive?: boolean
}

export interface CreateQuestionData {
  title: string
  description: string
  submissionType: SubmissionType
  criteria?: string
  courseId: string
}

export interface UpdateQuestionData {
  id: string
  title?: string
  description?: string
  submissionType?: SubmissionType
  criteria?: string
  isActive?: boolean
}

export interface CreateBaseExampleData {
  questionId: string
  content: string
  type: SubmissionType
  fileUrl?: string
  metadata?: Record<string, any>
}

export interface UpdateBaseExampleData {
  id: string
  content?: string
  type?: SubmissionType
  fileUrl?: string | null
  metadata?: Record<string, any> | null
}

// Assessment types
export interface AssessmentResult {
  score: number
  feedback: string
  confidence: number
  comparisonData: {
    similarities: string[]
    differences: string[]
    suggestions: string[]
  }
}

// Error types
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}