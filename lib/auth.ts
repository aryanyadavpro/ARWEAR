import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  firstName: string
  lastName: string
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined')
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return null
    }

    const decoded = await verifyToken(token)
    return decoded
  } catch (error) {
    console.error('Get auth user failed:', error)
    return null
  }
}

// Lazy-load DB modules to avoid build-time import of Mongo connection
export async function getUserFromToken(token: string) {
  try {
    const decoded = await verifyToken(token)
    if (!decoded) return null

    const [{ default: connectDB }, { default: User }] = await Promise.all([
      import('./mongodb'),
      import('@/models/User')
    ])

    await connectDB()
    const user = await User.findById(decoded.userId).select('-password')
    return user
  } catch (error) {
    console.error('Get user from token failed:', error)
    return null
  }
}

export function generateToken(payload: { userId: string; email: string; firstName: string; lastName: string }): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}
