"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (user: AuthUser) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        console.log('Auth check successful:', data.user.firstName)
      } else if (response.status === 401) {
        // Unauthorized - user not logged in
        setUser(null)
        console.log('User not authenticated')
      } else {
        // Other errors - retry once on mobile
        if (retryCount === 0 && /Mobi|Android/i.test(navigator.userAgent)) {
          console.log('Retrying auth check on mobile...')
          setTimeout(() => checkAuth(1), 1000)
          return
        }
        console.error('Auth check failed with status:', response.status)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Retry once on network errors for mobile
      if (retryCount === 0 && /Mobi|Android/i.test(navigator.userAgent)) {
        console.log('Retrying auth check after network error...')
        setTimeout(() => checkAuth(1), 2000)
        return
      }
      setUser(null)
    } finally {
      // Always set loading to false after auth check completes
      // This ensures loading state is properly reset in all scenarios
      setLoading(false)
    }
  }

  const login = (userData: AuthUser) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      // Immediately update the user state to null
      setUser(null)
      // Force a re-render by triggering state change
      setLoading(false)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if logout fails, clear user state locally
      setUser(null)
      router.push('/')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
