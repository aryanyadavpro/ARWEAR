"use client"

import ProductCard from "./product-card"
import { seedProducts } from "@/data/seed-products"

export default function ProductList() {
  // TODO: Replace with Supabase fetch from "products" table
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {seedProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
