"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
        credentials: 'include' // Important for cookies
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Update auth context with user data
      login(data.user)
      
      // Force a small delay to ensure auth context is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Login successful, redirect to products page or back to where user came from
      const urlParams = new URLSearchParams(window.location.search)
      const from = urlParams.get('from')
      
      // Use window.location.href for more reliable redirect
      if (from && from !== '/sign-in' && from !== '/sign-up') {
        window.location.href = from
      } else {
        window.location.href = '/products'
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(err.message || "Login failed. Please check your credentials.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
          <p className="text-sm text-gray-600 text-center">Enter your credentials to access your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            )}
            
            {loading && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
                🔄 Signing you in... Please wait.
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing In...
                </span>
              ) : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="#" className="text-sm text-blue-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
          
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
