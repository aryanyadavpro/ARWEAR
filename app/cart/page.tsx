"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatInrFromUsdCents } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"

export default function CartPage() {
  const { items, remove, totalCents } = useCartStore()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Your Cart</h1>
      {items.length === 0 ? (
        <p className="mt-6">
          Your cart is empty.{" "}
          <Link className="underline" href="/products">
            Continue shopping
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((it) => (
            <div key={`${it.productId}-${it.size}`} className="flex items-center gap-4 border rounded-md p-3">
              <div className="relative h-16 w-16 overflow-hidden rounded">
                <Image
                  src={it.previewImage || "/placeholder.svg"}
                  alt={`${it.title} thumbnail`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium">{it.title}</p>
                <p className="text-sm text-muted-foreground">Size: {it.size}</p>
              </div>
              <div className="w-40 text-right">{formatInrFromUsdCents(it.priceCents)}</div>
              <Button
                variant="destructive"
                onClick={() => remove(it.productId, it.size)}
                aria-label={`Remove ${it.title}`}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-lg font-medium">Total</p>
            <p className="text-lg font-semibold">{formatInrFromUsdCents(totalCents)}</p>
          </div>
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
