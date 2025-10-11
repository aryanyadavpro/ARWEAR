import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { findFallbackUser, createFallbackUser, sanitizeFallbackUser } from '@/lib/fallback-auth'

// This route needs to be dynamic as it sets cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    let user = null
    let userSource = 'database'

    // Check if user already exists in fallback system
    const existingFallbackUser = findFallbackUser(email)
    if (existingFallbackUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    try {
      // Try database first
      await connectDB()
      
      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 400 }
        )
      }

      // Create new user (password will be hashed by the pre-save middleware)
      user = await User.create({
        email,
        password,
        firstName,
        lastName
      })
    } catch (dbError) {
      console.warn('Database connection failed, using fallback auth:', dbError)
      // Create user in fallback system
      user = createFallbackUser({ email, password, firstName, lastName })
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
        message: 'User created successfully',
        user: {
          id: userSource === 'database' ? user._id : user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        source: userSource
      },
      { status: 201 }
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
    console.error('Signup error:', error)
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
