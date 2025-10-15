"use client"

import { create } from "zustand"

type CartItem = {
  productId: string
  title: string
  priceCents: number
  qty: number
  size: string
  previewImage: string
}

type CartState = {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, qty: number) => void
  getItemCount: () => number
  clear: () => void
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  add: (item) => {
    const existing = get().items.find((i) => i.productId === item.productId && i.size === item.size)
    if (existing) {
      set({ items: get().items.map((i) => (i === existing ? { ...i, qty: i.qty + item.qty } : i)) })
    } else {
      set({ items: [...get().items, item] })
    }
  },
  remove: (productId, size) =>
    set({ items: get().items.filter((i) => !(i.productId === productId && i.size === size)) }),
  updateQuantity: (productId, size, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => !(i.productId === productId && i.size === size)) })
      return
    }
    set({ items: get().items.map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i)) })
  },
  getItemCount: () => {
    return get().items.reduce((count, i) => count + i.qty, 0)
  },
  clear: () => set({ items: [] }),
  getTotalPrice: () => {
    return get().items.reduce((sum, i) => sum + i.priceCents * i.qty, 0)
  },
}))
