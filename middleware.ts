import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/models/') ||
    pathname.includes('.') && !pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/admin',
    '/account',
    '/profile',
    '/dashboard',
    '/checkout',
    '/orders',
    '/wishlist'
  ]

  // Auth routes that should redirect if already authenticated
  const authRoutes = ['/auth/signin', '/auth/signup', '/sign-in', '/sign-up']

  // Check route types
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Get authentication token (simplified check)
  const token = request.cookies.get('token')?.value
  let isAuthenticated = Boolean(token)
  let user = null

  // For production, you would verify the JWT properly
  // For now, we'll do a simple token presence check
  if (token) {
    try {
      // Simple base64 decode to get user info (for demo purposes)
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        user = payload
        isAuthenticated = true
      }
    } catch (error) {
      console.log('Token parsing failed:', error)
      isAuthenticated = false
    }
  }

  // Handle protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('from', pathname + search)
    
    const response = NextResponse.redirect(signInUrl)
    // Clear invalid token if present
    if (token) {
      response.cookies.delete('token')
    }
    return response
  }

  // Handle auth routes - redirect if already authenticated
  if (isAuthRoute && isAuthenticated) {
    const from = request.nextUrl.searchParams.get('from')
    const redirectTo = from && !authRoutes.includes(from) ? from : '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Add user context to response headers
  const response = NextResponse.next()
  
  if (isAuthenticated && user) {
    response.headers.set('x-user-id', String(user.userId || ''))
    response.headers.set('x-user-email', String(user.email || ''))
    response.headers.set('x-user-authenticated', 'true')
    response.headers.set('x-auth-source', String(user.authMethod || 'jwt'))
  } else {
    response.headers.set('x-user-authenticated', 'false')
  }

  // Security and debugging headers
  response.headers.set('x-pathname', pathname)
  response.headers.set('x-timestamp', new Date().toISOString())
  response.headers.set('x-middleware-version', '2.0.0')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (handled by route handlers)
     * - Static assets (_next/static)
     * - Image optimization (_next/image)
     * - Favicon
     * - Public assets (images, models, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|models|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}
