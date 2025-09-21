import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Check if user is authenticated
    if (!token) {
      // Allow access to public routes
      if (pathname.startsWith('/auth') || 
          pathname === '/' || 
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon')) {
        return NextResponse.next()
      }
      
      // Redirect to signin for protected routes
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    const userRole = token.role as UserRole

    // Admin routes - only SuperAdmin and CourseAdmin
    if (pathname.startsWith('/admin')) {
      if (![UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // SuperAdmin only routes
    if (pathname.startsWith('/admin/users') || 
        pathname.startsWith('/admin/system')) {
      if (userRole !== UserRole.SUPER_ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Student routes
    if (pathname.startsWith('/courses') || 
        pathname.startsWith('/submit') || 
        pathname.startsWith('/results')) {
      // All authenticated users can access these
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes without token
        if (pathname.startsWith('/auth') || 
            pathname === '/' || 
            pathname.startsWith('/api/auth') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon')) {
          return true
        }
        
        // For all other routes, require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}