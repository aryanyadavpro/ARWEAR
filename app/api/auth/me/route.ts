import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

// This route needs to be dynamic as it reads cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Validate token and decode user from JWT (no DB dependency)
    const authUser = await getAuthUser(request)

    if (!authUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        user: {
          id: authUser.userId,
          email: authUser.email,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
        }
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
