import Stripe from "stripe"

// Omit apiVersion to use the SDK's default for the installed @types
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")
