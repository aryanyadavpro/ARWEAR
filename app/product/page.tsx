"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, ShoppingBag, Eye } from "lucide-react"
import ProductList from "@/components/product-list"

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function ProductPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        // Not authenticated, redirect to sign-in
        router.push('/sign-in')
        return
      }
      
      const userData = await response.json()
      setUser(userData.user)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/sign-in')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            ARWEAR
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="h-5 w-5" />
              <span>Welcome, {user.firstName}!</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4">
            Welcome to Your AR Experience
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Explore our collection with cutting-edge AR technology. Try on clothes virtually and see them in your space!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardContent className="p-6 text-center">
                <Eye className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Virtual Try-On</h3>
                <p className="text-slate-300">See how clothes look on you using your camera</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">3D Models</h3>
                <p className="text-slate-300">Place realistic 3D models in your environment</p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Personalized</h3>
                <p className="text-slate-300">Get recommendations based on your preferences</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            AR-Enabled Products
          </h2>
          <ProductList />
        </section>
      </main>
    </div>
  )
}
