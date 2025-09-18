import { z } from 'zod'
import { SubmissionType, Role } from '@prisma/client'

// Course validation schemas
export const createCourseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  adminId: z.string()
    .uuid('Invalid admin ID format')
    .optional(),
})

export const updateCourseSchema = z.object({
  id: z.string().uuid('Invalid course ID format'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  adminId: z.string()
    .uuid('Invalid admin ID format')
    .optional(),
})

// Question validation schemas
export const createQuestionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  submissionType: z.nativeEnum(SubmissionType, {
    errorMap: () => ({ message: 'Invalid submission type' })
  }),
  criteria: z.string()
    .max(1000, 'Criteria must be less than 1000 characters')
    .optional()
    .nullable(),
  courseId: z.string().uuid('Invalid course ID format'),
})

export const updateQuestionSchema = z.object({
  id: z.string().uuid('Invalid question ID format'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional(),
  submissionType: z.nativeEnum(SubmissionType, {
    errorMap: () => ({ message: 'Invalid submission type' })
  }).optional(),
  criteria: z.string()
    .max(1000, 'Criteria must be less than 1000 characters')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
})

// Base example validation schemas
export const createBaseExampleSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format'),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters')
    .trim(),
  type: z.nativeEnum(SubmissionType, {
    errorMap: () => ({ message: 'Invalid submission type' })
  }),
  fileUrl: z.string()
    .url('Invalid file URL format')
    .optional()
    .nullable(),
  metadata: z.record(z.any())
    .optional()
    .nullable(),
})

export const updateBaseExampleSchema = z.object({
  id: z.string().uuid('Invalid base example ID format'),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10000 characters')
    .trim()
    .optional(),
  type: z.nativeEnum(SubmissionType, {
    errorMap: () => ({ message: 'Invalid submission type' })
  }).optional(),
  fileUrl: z.string()
    .url('Invalid file URL format')
    .optional()
    .nullable(),
  metadata: z.record(z.any())
    .optional()
    .nullable(),
})

// Submission validation schemas
export const createSubmissionSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format'),
  content: z.string()
    .max(50000, 'Content must be less than 50000 characters')
    .optional()
    .nullable(),
  fileUrl: z.string()
    .url('Invalid file URL format')
    .optional()
    .nullable(),
  websiteUrl: z.string()
    .url('Invalid website URL format')
    .optional()
    .nullable(),
  githubUrl: z.string()
    .url('Invalid GitHub URL format')
    .regex(/github\.com/, 'Must be a valid GitHub URL')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // At least one submission field must be provided
    return !!(data.content || data.fileUrl || data.websiteUrl || data.githubUrl)
  },
  {
    message: 'At least one submission field (content, fileUrl, websiteUrl, or githubUrl) must be provided',
    path: ['root'],
  }
)

// User validation schemas
export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role' })
  }).optional(),
})

// Enrollment validation schemas
export const createEnrollmentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
  studentId: z.string().uuid('Invalid student ID format').optional(), // Optional for self-enrollment
})

// Common validation utilities
export const uuidSchema = z.string().uuid('Invalid ID format')
export const emailSchema = z.string().email('Invalid email format')
export const urlSchema = z.string().url('Invalid URL format')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
})

// Search schemas
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .trim(),
  filters: z.record(z.any()).optional(),
})

// File upload schemas
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
  fileType: z.string()
    .min(1, 'File type is required')
    .regex(/^[a-zA-Z0-9\/\-]+$/, 'Invalid file type format'),
  fileSize: z.number()
    .int()
    .min(1, 'File size must be at least 1 byte')
    .max(50 * 1024 * 1024, 'File size cannot exceed 50MB'), // 50MB limit
})

// Assessment configuration schemas
export const assessmentConfigSchema = z.object({
  useBaseExample: z.boolean().default(true),
  autoAssess: z.boolean().default(true),
  requireManualReview: z.boolean().default(false),
  maxRetries: z.number().int().min(0).max(5).default(3),
  timeoutSeconds: z.number().int().min(30).max(300).default(120),
})

// Type exports for use in other files
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type CreateBaseExampleInput = z.infer<typeof createBaseExampleSchema>
export type UpdateBaseExampleInput = z.infer<typeof updateBaseExampleSchema>
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type AssessmentConfigInput = z.infer<typeof assessmentConfigSchema>