"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatInrFromUsdCents } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"

export default function CartPage() {
  const { items, remove, getTotalPrice } = useCartStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-4 lg:py-8">
        <h1 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-white mb-4 lg:mb-6">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 text-center">
            <p className="text-slate-300 mb-4">
              Your cart is empty.
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {items.map((it) => (
              <div key={`${it.productId}-${it.size}`} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative h-20 w-20 lg:h-24 lg:w-24 overflow-hidden rounded-lg flex-shrink-0">
                    <Image
                      src={it.previewImage || "/placeholder.svg"}
                      alt={`${it.title} thumbnail`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-lg">{it.title}</p>
                    <p className="text-sm text-slate-400 mt-1">Size: {it.size}</p>
                    <p className="text-base lg:text-lg font-semibold text-blue-400 mt-2 sm:hidden">
                      {formatInrFromUsdCents(it.priceCents)}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-lg font-semibold text-blue-400">{formatInrFromUsdCents(it.priceCents)}</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => remove(it.productId, it.size)}
                    aria-label={`Remove ${it.title}`}
                    className="min-h-[44px] touch-manipulation self-start sm:self-center"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-lg lg:text-xl font-medium text-white">Total</p>
                <p className="text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {formatInrFromUsdCents(getTotalPrice())}
                </p>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-h-[52px] touch-manipulation text-lg font-semibold">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
