"use client"

import Link from "next/link"
import { ShoppingCart, Menu, User, LogOut } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function Header() {
  const count = useCartStore((s) => s.items.length)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  
  return (
    <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-white">
            ARWEAR
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Welcome message - show first when user is logged in */}
          {user && (
            <div className="flex items-center gap-2 text-gray-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Welcome, {user.firstName}!</span>
            </div>
          )}
          
          {/* Navigation Links - always show */}
          <nav className="flex items-center gap-6">
            <Link href="/products" className="text-slate-300 hover:text-white transition-colors font-medium">
              Products
            </Link>
            <Link href="/#features" className="text-slate-300 hover:text-white transition-colors font-medium">
              Features
            </Link>
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
              <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
                <Link href="/cart" aria-label="Cart" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium">
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
            <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              <Link href="/cart" aria-label="Cart" className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center text-[10px] font-medium">
                  {count}
                </span>
              </Link>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900">
          <div className="px-4 py-4 space-y-3">
            {/* Always show Products and Features links */}
            <Link 
              href="/products" 
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/#features" 
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-2 text-gray-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Welcome, {user.firstName}!</span>
                  </div>
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
    </header>
  )
}
