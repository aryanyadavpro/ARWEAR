"use client"

import { loadStripe } from "@stripe/stripe-js"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function CheckoutPage() {
  const { items, clear } = useCartStore()
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "")
        if (!stripe) throw new Error("Stripe failed to load")
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (error) {
          console.error(error.message)
        }
      } else {
        console.error("No session id returned", data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">You will be redirected to Stripe (test mode).</p>
      <div className="mt-6">
        <Button onClick={handleCheckout} disabled={loading || items.length === 0}>
          {loading ? "Processing..." : "Pay with Stripe (Test)"}
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        After successful payment, a Supabase order will be created via webhook. You may clear the cart manually if
        needed.
      </p>
      <div className="mt-4">
        <Button variant="outline" onClick={() => clear()}>
          Clear Cart
        </Button>
      </div>
    </div>
  )
}
