import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"

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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    )
    const items = JSON.parse(session.metadata?.items || "[]")

    await supabase.from("orders").insert({
      user_email: session.customer_details?.email || null,
      items,
      amount_total: session.amount_total,
      status: "paid",
      stripe_session_id: session.id,
    })
  }

  return NextResponse.json({ received: true })
}
