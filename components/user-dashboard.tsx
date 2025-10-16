"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  ShoppingBag, 
  Heart, 
  Settings, 
  Package, 
  Truck, 
  CheckCircle,
  Star,
  Camera,
  Smartphone,
  Eye,
  MapPin,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Home
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { formatInrFromUsdCents } from "@/lib/utils"
import Link from "next/link"

// Mock data for dashboard
const mockOrders = [
  {
    id: "ORD-001",
    date: "2024-10-10",
    status: "delivered",
    total: 2999,
    items: [
      { name: "Green Woman T-Shirt", size: "M", price: 2999, image: "/api/placeholder/60/60" }
    ]
  },
  {
    id: "ORD-002", 
    date: "2024-10-08",
    status: "processing",
    total: 3499,
    items: [
      { name: "Baggy Pants", size: "L", price: 3499, image: "/api/placeholder/60/60" }
    ]
  },
  {
    id: "ORD-003",
    date: "2024-10-05", 
    status: "shipped",
    total: 4999,
    items: [
      { name: "Designer Jacket", size: "M", price: 4999, image: "/api/placeholder/60/60" }
    ]
  }
]

const mockWishlist = [
  { id: "1", name: "Blue Denim Jacket", price: 3999, image: "/api/placeholder/150/150" },
  { id: "2", name: "Black Hoodie", price: 2499, image: "/api/placeholder/150/150" },
  { id: "3", name: "White Sneakers", price: 5999, image: "/api/placeholder/150/150" }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "processing":
      return <Package className="h-4 w-4 text-yellow-500" />
    case "shipped":
      return <Truck className="h-4 w-4 text-blue-500" />
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    default:
      return <Package className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "processing":
      return "bg-yellow-100 text-yellow-800"
    case "shipped":
      return "bg-blue-100 text-blue-800"
    case "delivered":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

interface UserDashboardProps {
  onClose?: () => void;
}

export default function UserDashboard({ onClose }: UserDashboardProps = {}) {
  const { user } = useAuth()
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [userAddress, setUserAddress] = useState({
    street: "old satkar tower (A wing, room no 205) chinchpada road near saket college kalyan east",
    city: "kalyan east",
    state: "Maharashtra", 
    pincode: "421306",
    country: "India"
  })
  const [tempAddress, setTempAddress] = useState(userAddress)

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Please sign in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild className="flex-1">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSaveAddress = () => {
    setUserAddress(tempAddress)
    setIsEditingAddress(false)
    // Here you would typically save to backend
  }

  const handleCancelEdit = () => {
    setTempAddress(userAddress)
    setIsEditingAddress(false)
  }

  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Close Button - Only show if onClose is provided (overlay mode) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
          aria-label="Close Dashboard"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}
      
      {/* Left Sidebar */}
      <div className="w-80 bg-slate-800 text-white p-6 flex flex-col">
        {/* Profile Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.firstName} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Joined</span>
            <span className="text-sm text-white ml-auto">10/15/2025</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Orders</span>
            <span className="text-sm text-white ml-auto">{mockOrders.length}</span>
          </div>
        </div>

        {/* Address Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Home Location</span>
            </div>
            {!isEditingAddress ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingAddress(true)}
                className="text-slate-400 hover:text-white p-1"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSaveAddress}
                  className="text-green-400 hover:text-green-300 p-1"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {!isEditingAddress ? (
            <div className="text-xs text-slate-300 leading-relaxed">
              {userAddress.street}<br/>
              {userAddress.city}, {userAddress.state} {userAddress.pincode}<br/>
              {userAddress.country}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Street Address"
                value={tempAddress.street}
                onChange={(e) => setTempAddress({...tempAddress, street: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white text-xs"
              />
              <div className="grid grid-cols-2 gap-1">
                <Input
                  placeholder="City"
                  value={tempAddress.city}
                  onChange={(e) => setTempAddress({...tempAddress, city: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white text-xs"
                />
                <Input
                  placeholder="PIN"
                  value={tempAddress.pincode}
                  onChange={(e) => setTempAddress({...tempAddress, pincode: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Quick Actions</span>
          </div>
          
          <Button className="w-full justify-start text-left bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white border-0" size="sm">
            <Package className="h-4 w-4 mr-3" />
            View Orders
          </Button>
          
          <Button className="w-full justify-start text-left bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white border-0" size="sm">
            <Settings className="h-4 w-4 mr-3" />
            Account Settings
          </Button>
        </div>

      </div>

      {/* Right Content Area */}
      <div className="flex-1 bg-gray-50">
        {/* Main Content */}
        <div className="p-8">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
              AR Fashion Technology
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Experience Fashion
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                in Augmented Reality
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Try on clothes virtually with cutting-edge AR technology. See how garments look 
              on you in real-time, place 3D models in your space, and shop with confidence. All 
              processing happens on your device for maximum privacy.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-12">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 text-lg">
                <Link href="/products">
                  Start Shopping →
                </Link>
              </Button>
              <Button variant="outline" className="px-8 py-3 text-lg">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9★</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
