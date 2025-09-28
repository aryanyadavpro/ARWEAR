import ProductList from "@/components/product-list"

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-2xl md:text-3xl font-semibold">All Products</h2>
      <ProductList />
    </div>
  )
}
