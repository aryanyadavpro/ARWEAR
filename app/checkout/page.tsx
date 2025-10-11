"use client"

import { loadStripe } from "@stripe/stripe-js"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { AlertCircle, CreditCard, ShoppingBag } from "lucide-react"

export default function CheckoutPage() {
  const { items, clear, totalCents } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCheckout() {
    if (items.length === 0) {
      setError("Your cart is empty. Please add items before checkout.")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.sessionId) {
        const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
        if (!stripePublicKey) {
          throw new Error("Stripe public key is not configured. Please check your environment variables.")
        }
        
        const stripe = await loadStripe(stripePublicKey)
        if (!stripe) {
          throw new Error("Failed to load Stripe. Please check your internet connection and try again.")
        }
        
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (error) {
          throw new Error(error.message || "An error occurred while redirecting to checkout.")
        }
      } else {
        throw new Error("No session ID returned from server. Please try again.")
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Use totalCents from store

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase securely with Stripe</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">Size: {item.size} • Qty: {item.qty}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ₹{Math.round((item.priceCents * item.qty * 83) / 100)}
                      </p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-900">Total</p>
                      <p className="text-lg font-bold text-violet-600">
                        ₹{Math.round((totalCents * 83) / 100)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Test Mode:</strong> Use test card numbers
                </p>
                <p className="text-xs text-blue-600">
                  Card: 4242 4242 4242 4242 • Any future date • Any 3 digits
                </p>
              </div>
              
              <Button 
                onClick={handleCheckout} 
                disabled={loading || items.length === 0}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 text-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `Pay ₹${Math.round((totalCents * 83) / 100)} with Stripe`
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  clear()
                  setError("")
                }}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Clear Cart
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Your payment is secured by Stripe. We never store your card details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
