import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { findFallbackUser, validateFallbackPassword, sanitizeFallbackUser } from '@/lib/fallback-auth'

// This route needs to be dynamic as it sets cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Signin request received')
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Attempting fallback authentication for:', email)
    
    // Use fallback authentication first (more reliable)
    const fallbackUser = findFallbackUser(email)
    
    if (!fallbackUser || !validateFallbackPassword(fallbackUser, password)) {
      console.log('Fallback authentication failed')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    console.log('Fallback authentication successful')
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: fallbackUser.id,
        email: fallbackUser.email,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        source: 'fallback'
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    console.log('JWT token created')

    // Create response
    const response = NextResponse.json(
      {
        message: 'Sign in successful',
        user: {
          id: fallbackUser.id,
          email: fallbackUser.email,
          firstName: fallbackUser.firstName,
          lastName: fallbackUser.lastName
        },
        source: 'fallback'
      },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days (in seconds)
    })

    console.log('Response created successfully')
    return response

  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
