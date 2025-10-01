"use client"

import Link from "next/link"
import { ShoppingCart, Sparkles, Menu, User, LogOut } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

export default function Header() {
  const count = useCartStore((s) => s.items.length)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout, loading } = useAuth()
  
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            ARWEAR
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Welcome message - show first when user is logged in */}
          {user && (
            <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 px-3 py-1.5 rounded-md">
              <User className="h-4 w-4" />
              <span className="text-sm">Welcome, {user.firstName}!</span>
            </div>
          )}
          
          {/* Navigation Links - only show when user is logged in */}
          {user && (
            <nav className="flex items-center gap-6">
              <Link href="/products" className="text-slate-300 hover:text-white transition-colors font-medium">
                Products
              </Link>
              <Link href="/#features" className="text-slate-300 hover:text-white transition-colors font-medium">
                Features
              </Link>
            </nav>
          )}
          
          <div className="flex items-center gap-3 ml-4">
            {/* Auth Buttons - only show when not logged in */}
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            ) : !user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </>
            ) : null}
            
            {/* Cart Button */}
            <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Link href="/cart" aria-label="Cart" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {count}
                </span>
              </Link>
            </Button>
            
            {/* Logout Button - positioned after cart */}
            {user && (
              <Button 
                onClick={logout} 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Link href="/cart" aria-label="Cart" className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center text-[10px]">
                {count}
              </span>
            </Link>
          </Button>
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
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="px-4 py-4 space-y-3">
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
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-2 text-slate-300 bg-slate-800/30 px-3 py-2 rounded-md mb-2">
                    <User className="h-4 w-4" />
                    <span>Welcome, {user.firstName}!</span>
                  </div>
                  <Button 
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }} 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-300 hover:text-white hover:bg-slate-800 justify-start"
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
                  <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 justify-start">
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
