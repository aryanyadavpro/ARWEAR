import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { convertUsdCentsToInrPaise } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as {
      items: Array<{ productId: string; title: string; priceCents: number; qty: number; size: string }>
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided for checkout" },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.title || !item.priceCents || !item.qty || !item.size) {
        return NextResponse.json(
          { error: "Invalid item data provided" },
          { status: 400 }
        )
      }
      if (item.priceCents <= 0 || item.qty <= 0) {
        return NextResponse.json(
          { error: "Invalid price or quantity" },
          { status: 400 }
        )
      }
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      return NextResponse.json(
        { error: "Payment system is not configured. Please contact support." },
        { status: 500 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cart`,
      line_items: items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: { 
            name: `${item.title} (${item.size})`,
            description: `Size: ${item.size}` 
          },
          unit_amount: convertUsdCentsToInrPaise(item.priceCents),
        },
        quantity: item.qty,
      })),
      metadata: {
        items: JSON.stringify(items),
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error("Checkout error:", e)
    
    // Handle specific Stripe errors
    if (e.type === 'StripeCardError') {
      return NextResponse.json({ error: "Your card was declined." }, { status: 400 })
    }
    if (e.type === 'StripeRateLimitError') {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }
    if (e.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: "Invalid payment request." }, { status: 400 })
    }
    if (e.type === 'StripeAPIError') {
      return NextResponse.json({ error: "Payment service is currently unavailable." }, { status: 503 })
    }
    if (e.type === 'StripeConnectionError') {
      return NextResponse.json({ error: "Network error. Please check your connection." }, { status: 503 })
    }
    if (e.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: "Payment system configuration error." }, { status: 500 })
    }
    
    return NextResponse.json(
      { error: e.message || "An unexpected error occurred during checkout." },
      { status: 500 }
    )
  }
}
