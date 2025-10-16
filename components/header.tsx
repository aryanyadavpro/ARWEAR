"use client"

import Link from "next/link"
import { ShoppingCart, Menu, User, LogOut, X, Calendar, Package, MapPin, Settings, Mail } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { handleSmoothScroll } from "@/lib/smooth-scroll"

export default function Header() {
  const count = useCartStore((s) => s.getItemCount())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  
  const handleNavClick = (href: string) => {
    if (!handleSmoothScroll(href)) {
      router.push(href)
    }
  }
  
  const handleMobileNavClick = (href: string) => {
    if (!handleSmoothScroll(href, () => setMobileMenuOpen(false))) {
      router.push(href)
      setMobileMenuOpen(false)
    }
  }
  
  return (
    <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between touch-manipulation">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-white">
            ARWEAR
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* User Avatar - clickable to go to dashboard */}
          {user && (
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="flex items-center gap-2 text-gray-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer min-h-[44px] touch-manipulation"
            >
              <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Welcome, {user.firstName}!</span>
              <span className="text-sm font-medium sm:hidden">{user.firstName}</span>
            </button>
          )}
          
          {/* Navigation Links - always show */}
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => handleNavClick('/products')} 
              className="text-slate-300 hover:text-white transition-colors font-medium cursor-pointer px-3 py-2 rounded-md hover:bg-slate-800 min-h-[44px] touch-manipulation"
            >
              Products
            </button>
            <button 
              onClick={() => handleNavClick('/#features')} 
              className="text-slate-300 hover:text-white transition-colors font-medium cursor-pointer px-3 py-2 rounded-md hover:bg-slate-800 min-h-[44px] touch-manipulation"
            >
              Features
            </button>
            {user && (
              <button 
                onClick={() => handleNavClick('/dashboard')} 
                className="text-slate-300 hover:text-white transition-colors font-medium cursor-pointer px-3 py-2 rounded-md hover:bg-slate-800 min-h-[44px] touch-manipulation"
              >
                Dashboard
              </button>
            )}
          </nav>
          
          <div className="flex items-center gap-3 ml-4">
            {/* Auth Buttons - only show when not logged in */}
            {loading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            ) : !user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </>
            ) : null}
            
            {/* Cart Button - only show when user is logged in */}
            {user && (
              <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white min-h-[44px] touch-manipulation">
                <Link href="/cart" aria-label="Cart" className="flex items-center gap-2 px-3 py-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center font-medium">
                    {count}
                  </span>
                </Link>
              </Button>
            )}
            
            {/* Logout Button - positioned after cart */}
            {user && (
              <Button 
                onClick={logout} 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Cart - only show when user is logged in */}
          {user && (
            <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50 min-h-[44px] min-w-[44px] touch-manipulation">
              <Link href="/cart" aria-label="Cart" className="flex items-center justify-center gap-1 p-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-5 flex items-center justify-center font-medium">
                  {count}
                </span>
              </Link>
            </Button>
          )}
          <Button
            variant="ghost" 
            size="sm" 
            className="text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900">
          <div className="px-4 py-4 space-y-3">
            {/* Always show Products and Features links */}
            <button 
              onClick={() => handleMobileNavClick('/products')}
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2 text-left w-full"
            >
              Products
            </button>
            <button 
              onClick={() => handleMobileNavClick('/#features')}
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2 text-left w-full"
            >
              Features
            </button>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                </div>
              ) : user ? (
                <>
                  <button
                    onClick={() => {
                      setDashboardOpen(!dashboardOpen)
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 text-gray-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 mb-2 hover:bg-green-100 transition-colors cursor-pointer w-full"
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span className="font-medium">Welcome, {user.firstName}!</span>
                  </button>
                  <Button 
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }} 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 justify-start">
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white justify-start">
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Sliding Panel */}
      <>
        {/* Background Overlay */}
        <div 
          className={`fixed inset-0 z-[60] bg-black transition-opacity duration-300 ${
            dashboardOpen ? 'bg-opacity-30' : 'bg-opacity-0 pointer-events-none'
          }`} 
          onClick={() => setDashboardOpen(false)}
        />
        
        {/* Sliding Panel */}
        <div 
          className={`fixed top-0 left-0 h-full w-80 sm:w-96 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out z-[70] shadow-2xl ${
            dashboardOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Close Button */}
            <button
              onClick={() => setDashboardOpen(false)}
              className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 rounded-full p-2 transition-colors"
              aria-label="Close Dashboard"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            
            {/* Dashboard Content */}
            <div className="p-6 h-full overflow-y-auto">
              {user && (
                <>
                  {/* Profile Section */}
                  <div className="mb-8 pt-8">
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
                      <span className="text-sm text-white ml-auto">0</span>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Home Location</span>
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      old satkar tower (A wing, room no 205)<br/>
                      chinchpada road near saket college<br/>
                      kalyan east, Maharashtra 421306<br/>
                      India
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Quick Actions</span>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        handleNavClick('/products')
                        setDashboardOpen(false)
                      }}
                      className="w-full justify-start text-left bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white border-0" 
                      size="sm"
                    >
                      <Package className="h-4 w-4 mr-3" />
                      View Products
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        handleNavClick('/cart')
                        setDashboardOpen(false)
                      }}
                      className="w-full justify-start text-left bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white border-0" 
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-3" />
                      View Cart ({count})
                    </Button>
                    
                    <Button className="w-full justify-start text-left bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white border-0" size="sm">
                      <Settings className="h-4 w-4 mr-3" />
                      Account Settings
                    </Button>
                  </div>
                </>
              )}
            </div>
        </div>
      </>
    </header>
  )
}
