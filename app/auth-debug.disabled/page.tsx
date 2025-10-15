"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
// import AuthDebugEnhanced from '@/components/auth-debug-enhanced'
import Link from 'next/link'
import { ArrowLeft, User, LogOut } from 'lucide-react'

export default function AuthDebugPage() {
  const { user, logout, loading } = useAuth()
  const [authStatus, setAuthStatus] = useState<any>(null)

  // Check current auth status
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      const data = await response.json()
      setAuthStatus({
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      })
    } catch (error: any) {
      setAuthStatus({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      })
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white">🔐 Authentication Debug Center</h1>
            <p className="text-slate-400">Debug and test authentication functionality</p>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Signed in as {user.firstName}</span>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Current Auth Status */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              📊 Current Authentication Status
              <Button 
                onClick={checkAuthStatus} 
                variant="outline" 
                size="sm" 
                className="ml-auto border-slate-600 text-slate-300"
              >
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">Auth Context</h3>
                <Badge variant={user ? "default" : "secondary"} className="mb-2">
                  {loading ? 'Loading...' : user ? `✅ Authenticated` : '❌ Not Authenticated'}
                </Badge>
                {user && (
                  <div className="text-sm text-slate-300 space-y-1">
                    <div><strong>ID:</strong> {user.id}</div>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Name:</strong> {user.firstName} {user.lastName}</div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">API Status</h3>
                {authStatus && (
                  <>
                    <Badge variant={authStatus.success ? "default" : "destructive"} className="mb-2">
                      {authStatus.success ? '✅ API Success' : '❌ API Failed'} ({authStatus.status})
                    </Badge>
                    <div className="text-xs text-slate-400">
                      Last checked: {authStatus.timestamp}
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">Browser Info</h3>
                <div className="text-xs text-slate-400 space-y-1">
                  <div><strong>Secure:</strong> {typeof window !== 'undefined' && window.isSecureContext ? 'Yes (HTTPS)' : 'No (HTTP)'}</div>
                  <div><strong>Cookies:</strong> {typeof document !== 'undefined' && document.cookie.includes('token') ? 'Token present' : 'No token'}</div>
                  <div><strong>UserAgent:</strong> {typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
                </div>
              </div>
            </div>

            {authStatus && authStatus.data && (
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">API Response</h3>
                <pre className="text-xs bg-black/30 p-3 rounded border border-slate-600 overflow-auto text-slate-300">
                  {JSON.stringify(authStatus.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Testing Tool */}
        {/* <AuthDebugEnhanced /> */}

        {/* Test Accounts Reference */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Available Test Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                  <h3 className="text-green-300 font-medium mb-1">Test User</h3>
                  <div className="text-sm text-green-200">
                    <div>Email: test@example.com</div>
                    <div>Password: password123</div>
                  </div>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h3 className="text-blue-300 font-medium mb-1">Demo User</h3>
                  <div className="text-sm text-blue-200">
                    <div>Email: demo@arwear.com</div>
                    <div>Password: demo123</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                  <h3 className="text-purple-300 font-medium mb-1">Admin User</h3>
                  <div className="text-sm text-purple-200">
                    <div>Email: admin@arwear.com</div>
                    <div>Password: admin123</div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <h3 className="text-yellow-300 font-medium mb-1">Sample User</h3>
                  <div className="text-sm text-yellow-200">
                    <div>Email: user@test.com</div>
                    <div>Password: 123456</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">⚡ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-in">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Go to Sign In Page
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Go to Sign Up Page
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Go to Products
                </Button>
              </Link>
              <Link href="/mobile-ar-test">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Mobile AR Test
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.reload()
                }}
                variant="outline" 
                className="border-red-600 text-red-300 hover:bg-red-600/10"
              >
                Clear All Storage & Reload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}