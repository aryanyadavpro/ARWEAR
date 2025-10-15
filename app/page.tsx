"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ProductList from "@/components/product-list"
import { ArrowRight, Smartphone, Globe, Shield, Zap, Star, Users, TrendingUp } from "lucide-react"
import { smoothScrollToSection } from "@/lib/smooth-scroll"

export default function HomePage() {
  // Handle hash-based navigation on page load
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        const sectionId = hash.substring(1)
        smoothScrollToSection(sectionId)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-violet-50">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-8 flex justify-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full border border-violet-200 hover:bg-violet-200 transition-colors">
              <span className="text-sm font-medium">AR Fashion Technology</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-200">
            Experience Fashion
            <br />
            <span className="text-violet-600 bg-gradient-to-r from-violet-600 to-green-600 bg-clip-text text-transparent">
              in Augmented Reality
            </span>
          </h1>
          
          <p className="mx-auto max-w-3xl text-xl text-gray-600 leading-relaxed mb-10 animate-fade-in-up animation-delay-400">
            Try on clothes virtually with cutting-edge AR technology. See how garments look on you in real-time,
            place 3D models in your space, and shop with confidence. All processing happens on your device
            for maximum privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up animation-delay-600">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-3 hover:scale-105 transition-all duration-200">
              <Link href="/products" className="flex items-center gap-2">
                Start Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button 
              onClick={() => smoothScrollToSection('features')} 
              variant="outline" 
              size="lg" 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-3 hover:scale-105 transition-all duration-200"
            >
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center animate-fade-in-up animation-delay-800">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:scale-105 transform duration-200">
              <div className="text-2xl font-bold text-violet-600 mb-1">98%</div>
              <div className="text-gray-600 text-sm">Accuracy Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:scale-105 transform duration-200">
              <div className="text-2xl font-bold text-green-600 mb-1">50K+</div>
              <div className="text-gray-600 text-sm">Happy Customers</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:scale-105 transform duration-200">
              <div className="text-2xl font-bold text-violet-600 mb-1">4.9★</div>
              <div className="text-gray-600 text-sm">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              AR Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Experience the future of online shopping with our advanced AR and virtual try-on technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="mb-4">
                <Smartphone className="h-10 w-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Virtual Try-On</h3>
              <p className="text-gray-600 text-sm">
                Use your camera to see how clothes look on you in real-time. Advanced body tracking ensures perfect fit visualization.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-100">
              <div className="mb-4">
                <Globe className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AR View in Space</h3>
              <p className="text-gray-600 text-sm">
                Place 3D clothing models in your real environment. Walk around and see garments from every angle.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-200">
              <div className="mb-4">
                <Shield className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-600 text-sm">
                All processing happens on your device. No data is sent to our servers, ensuring complete privacy.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-300">
              <div className="mb-4">
                <Zap className="h-10 w-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Performance</h3>
              <p className="text-gray-600 text-sm">
                Optimized performance with smooth rendering and instant load times on all devices.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-400">
              <div className="mb-4">
                <Star className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Quality</h3>
              <p className="text-gray-600 text-sm">
                High-resolution 3D models with realistic textures and materials for accurate representation.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-500">
              <div className="mb-4">
                <TrendingUp className="h-10 w-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Recommendations</h3>
              <p className="text-gray-600 text-sm">
                Get personalized size recommendations and fit insights for better shopping decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our curated collection of AR-enabled fashion items
            </p>
          </div>
          <ProductList />
          
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-white">
              <Link href="/products" className="flex items-center gap-2">
                View All Products
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Customers Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-green-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The AR try-on feature is incredible! I can finally see how clothes will look on me before buying. Game changer!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-semibold">S</span>
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Sarah Johnson</div>
                  <div className="text-gray-500 text-sm">Fashion Enthusiast</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-green-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Privacy-first approach and amazing quality. The 3D models are so realistic, it's like having a personal fitting room."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">M</span>
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Mike Chen</div>
                  <div className="text-gray-500 text-sm">Tech Professional</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-green-500 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Shopping has never been this fun and convenient. The AR placement feature helps me visualize outfits perfectly!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-violet-600 font-semibold">E</span>
                </div>
                <div>
                  <div className="text-gray-900 font-semibold">Emma Davis</div>
                  <div className="text-gray-500 text-sm">Style Blogger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have revolutionized their fashion journey with our AR technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-3">
              <Link href="/products" className="flex items-center gap-2">
                Start Shopping Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-white text-lg px-8 py-3">
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
