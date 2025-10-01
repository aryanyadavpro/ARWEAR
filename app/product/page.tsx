"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { User, ShoppingBag, Eye } from "lucide-react"
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your AR Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explore our collection with cutting-edge AR technology. Try on clothes virtually and see them in your space!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <Eye className="h-12 w-12 text-violet-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Try-On</h3>
                <p className="text-gray-600">See how clothes look on you using your camera</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3D Models</h3>
                <p className="text-gray-600">Place realistic 3D models in your environment</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-violet-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized</h3>
                <p className="text-gray-600">Get recommendations based on your preferences</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            AR-Enabled Products
          </h2>
          <ProductList />
        </section>
      </main>
    </div>
  )
}
