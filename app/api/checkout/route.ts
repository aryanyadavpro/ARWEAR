import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as {
      items: Array<{ productId: string; title: string; priceCents: number; qty: number; size: string }>
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cart`,
      line_items: items.map((it) => ({
        price_data: {
          currency: "usd",
          product_data: { name: `${it.title} (${it.size})` },
          unit_amount: it.priceCents,
        },
        quantity: it.qty,
      })),
      metadata: {
        items: JSON.stringify(items),
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
