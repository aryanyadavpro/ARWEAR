import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || ""
  let event
  const body = await req.text() // raw body for signature
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return new NextResponse("Bad signature", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    // TODO: Save order to MongoDB
    console.log("Order completed:", session.id)
  }

  return NextResponse.json({ received: true })
}
