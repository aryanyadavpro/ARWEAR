import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { findFallbackUser, createFallbackUser, sanitizeFallbackUser } from '@/lib/fallback-auth'

// This route needs to be dynamic as it sets cookies
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Signup request received')
    
    const body = await request.json()
    console.log('Signup request body:', body)
    
    const { email, password, firstName, lastName } = body

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log('Checking if user exists in fallback system')
    
    // Check if user already exists in fallback system
    const existingFallbackUser = findFallbackUser(email)
    if (existingFallbackUser) {
      console.log('User already exists in fallback system')
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    console.log('Creating user in fallback system')
    
    // Create user in fallback system
    const user = createFallbackUser({ email, password, firstName, lastName })

    console.log('User created successfully in fallback system')

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        source: 'fallback'
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    console.log('JWT token created for new user')

    // Create response
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        source: 'fallback'
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

    console.log('Signup response created successfully')
    return response

  } catch (error: any) {
    console.error('Signup error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
