import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { findFallbackUser, validateFallbackPassword, sanitizeFallbackUser } from '@/lib/fallback-auth'

// This route needs to be dynamic as it sets cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    let user = null
    let userSource = 'database'

    try {
      // Try database first
      await connectDB()
      user = await User.findOne({ email }).select('+password')
      
      if (user) {
        const isPasswordValid = await user.comparePassword(password)
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          )
        }
      }
    } catch (dbError) {
      console.warn('Database connection failed, using fallback auth:', dbError)
      userSource = 'fallback'
    }

    // If no user from database, try fallback authentication
    if (!user) {
      const fallbackUser = findFallbackUser(email)
      
      if (!fallbackUser || !validateFallbackPassword(fallbackUser, password)) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      
      user = fallbackUser
      userSource = 'fallback'
    }

    // Create JWT token (include basic profile fields to avoid DB dependency for auth checks)
    const token = jwt.sign(
      { 
        userId: userSource === 'database' ? user._id.toString() : user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        source: userSource
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    // Create response
    const response = NextResponse.json(
      {
        message: 'Sign in successful',
        user: {
          id: userSource === 'database' ? user._id : user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        source: userSource
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

    return response

  } catch (error: any) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
