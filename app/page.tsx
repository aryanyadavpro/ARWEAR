"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import ProductList from "@/components/product-list"
import { ArrowRight, Sparkles, Smartphone, Globe, Shield, Zap, Star, Users, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-slate-800/50 px-6 py-3 backdrop-blur border border-slate-700">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium text-slate-300">Now with Advanced AR Technology</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
            Experience Fashion
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              in Augmented Reality
            </span>
          </h1>
          
          <p className="mx-auto max-w-3xl text-xl text-slate-300 leading-relaxed mb-10">
            Try on clothes virtually with cutting-edge AR technology. See how garments look on you in real-time,
            place 3D models in your space, and shop with confidence. All processing happens on your device
            for maximum privacy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
              <Link href="/products" className="flex items-center gap-2">
                Start Shopping
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-3">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-slate-800/30 backdrop-blur rounded-lg p-6 border border-slate-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">98%</div>
              <div className="text-slate-300">Accuracy Rate</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur rounded-lg p-6 border border-slate-700">
              <div className="text-3xl font-bold text-purple-400 mb-2">50K+</div>
              <div className="text-slate-300">Happy Customers</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur rounded-lg p-6 border border-slate-700">
              <div className="text-3xl font-bold text-green-400 mb-2">4.9★</div>
              <div className="text-slate-300">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Revolutionary AR Features
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the future of online shopping with our advanced AR and virtual try-on technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="mb-6">
                <Smartphone className="h-12 w-12 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Virtual Try-On</h3>
              <p className="text-slate-300 mb-4">
                Use your camera to see how clothes look on you in real-time. Advanced body tracking ensures perfect fit visualization.
              </p>
              <div className="text-blue-400 font-medium">Real-time rendering →</div>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="mb-6">
                <Globe className="h-12 w-12 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">AR View in Space</h3>
              <p className="text-slate-300 mb-4">
                Place 3D clothing models in your real environment. Walk around and see garments from every angle.
              </p>
              <div className="text-purple-400 font-medium">Spatial tracking →</div>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-green-500 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="mb-6">
                <Shield className="h-12 w-12 text-green-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Privacy First</h3>
              <p className="text-slate-300 mb-4">
                All processing happens on your device. No data is sent to our servers, ensuring complete privacy.
              </p>
              <div className="text-green-400 font-medium">100% secure →</div>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20">
              <div className="mb-6">
                <Zap className="h-12 w-12 text-yellow-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Lightning Fast</h3>
              <p className="text-slate-300 mb-4">
                Optimized performance with 60fps rendering and instant load times on all devices.
              </p>
              <div className="text-yellow-400 font-medium">Ultra responsive →</div>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-red-500 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
              <div className="mb-6">
                <Star className="h-12 w-12 text-red-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Premium Quality</h3>
              <p className="text-slate-300 mb-4">
                High-resolution 3D models with realistic textures and materials for accurate representation.
              </p>
              <div className="text-red-400 font-medium">Photo-realistic →</div>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl border border-slate-700 hover:border-cyan-500 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20">
              <div className="mb-6">
                <TrendingUp className="h-12 w-12 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Smart Analytics</h3>
              <p className="text-slate-300 mb-4">
                Get personalized size recommendations and fit insights powered by machine learning.
              </p>
              <div className="text-cyan-400 font-medium">AI powered →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Featured Products
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Discover our curated collection of AR-enabled fashion items
            </p>
          </div>
          <ProductList />
          
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Link href="/products" className="flex items-center gap-2">
                View All Products
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our Customers Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-xl border border-slate-700">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "The AR try-on feature is incredible! I can finally see how clothes will look on me before buying. Game changer!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Sarah Johnson</div>
                  <div className="text-slate-400 text-sm">Fashion Enthusiast</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-xl border border-slate-700">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Privacy-first approach and amazing quality. The 3D models are so realistic, it's like having a personal fitting room."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Mike Chen</div>
                  <div className="text-slate-400 text-sm">Tech Professional</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-xl border border-slate-700">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Shopping has never been this fun and convenient. The AR placement feature helps me visualize outfits perfectly!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Emma Davis</div>
                  <div className="text-slate-400 text-sm">Style Blogger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Shopping Experience?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have revolutionized their fashion journey with our AR technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-3">
              <Link href="/products" className="flex items-center gap-2">
                Start Shopping Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-3">
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
