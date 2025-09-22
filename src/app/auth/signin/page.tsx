import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Assessment Agent</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin interface
          </p>
        </div>

        {/* Auth info card */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Setup</CardTitle>
            <CardDescription>
              Authentication is configured but requires additional setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                The admin interface authentication requires NextAuth configuration.
                For now, you can access the admin interface directly.
              </p>

              <div className="space-y-3">
                <Link href="/admin" className="block">
                  <Button className="w-full">
                    Go to Admin Interface
                  </Button>
                </Link>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Test credentials info */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Test Credentials Available:</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Super Admin:</span>
                  <span>superadmin@assessment.local</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Course Admin:</span>
                  <span>courseadmin@assessment.local</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Password:</span>
                  <span>admin123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}