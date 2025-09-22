'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, BookOpen, FileText } from 'lucide-react'
import { createCourse } from '@/lib/actions/course-actions'

const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(200, 'Course name is too long'),
  description: z.string().min(1, 'Course description is required'),
})

type CourseFormData = z.infer<typeof courseSchema>

interface CourseFormProps {
  initialData?: {
    id: string
    name: string
    description: string
  }
  isEdit?: boolean
}

export function CourseForm({ initialData, isEdit = false }: CourseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  })

  function onSubmit(data: CourseFormData) {
    startTransition(async () => {
      try {
        if (isEdit && initialData) {
          // TODO: Implement update course action
          toast.error('Update functionality not implemented yet')
          return
        } else {
          const result = await createCourse(data)

          if (result.success) {
            toast.success('Course created successfully!')
            router.push(`/admin/courses/${result.data.id}`)
          } else {
            toast.error(result.error || 'Failed to create course')
          }
        }
      } catch (error) {
        toast.error('An unexpected error occurred')
        console.error('Course form error:', error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-indigo-600" />
                </div>
                Course Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Introduction to React"
                  {...field}
                  disabled={isPending}
                  className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </FormControl>
              <FormDescription className="text-sm text-gray-600">
                A clear, descriptive name for your course
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <FileText className="w-3 h-3 text-blue-600" />
                </div>
                Course Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what students will learn in this course..."
                  className="min-h-[140px] border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription className="text-sm text-gray-600">
                Provide a detailed description of the course content and objectives
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isPending}
            className="min-w-[140px] h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Update Course' : 'Create Course'}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="h-11 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}