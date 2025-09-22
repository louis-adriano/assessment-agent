import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, BookOpen, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Assessment Agent</h1>
          </div>
          <Link href="/admin">
            <Button>Admin Portal</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              AI-Powered Assessment Platform
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Intelligent assessment system that compares student submissions against base examples
              using advanced AI for consistent, fair, and detailed feedback.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin">
                <Button size="lg" className="min-w-[150px]">
                  Admin Dashboard
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="min-w-[150px]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Course Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create and manage courses with role-based access control for administrators and students.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Smart Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI-powered assessment engine that compares submissions against perfect answer examples.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive user management with Super Admin, Course Admin, and Student roles.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Detailed analytics and performance insights for courses, questions, and submissions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Login Information */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Test the System</CardTitle>
              <CardDescription>
                Use these test credentials to explore the admin interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-2">Super Admin</h3>
                  <p className="text-sm text-red-600 mb-2">superadmin@assessment.local</p>
                  <p className="text-sm text-red-600">Password: admin123</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Course Admin</h3>
                  <p className="text-sm text-blue-600 mb-2">courseadmin@assessment.local</p>
                  <p className="text-sm text-blue-600">Password: admin123</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Student</h3>
                  <p className="text-sm text-green-600 mb-2">student@assessment.local</p>
                  <p className="text-sm text-green-600">Password: admin123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Assessment Agent. Built with Next.js, Prisma, and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}