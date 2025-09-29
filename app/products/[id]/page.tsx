"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatInrFromUsdCents } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"
import { seedProducts } from "@/data/seed-products"
import dynamic from "next/dynamic"
import TryOnComponent from "@/components/try-on-component"
import ARTest from "@/components/ar-test"
import ARErrorBoundary from "@/components/ar-error-boundary"

const ModelViewerAR = dynamic(() => import("@/components/model-viewer-ar"), { ssr: false })

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const product = useMemo(() => seedProducts.find((p) => p.id === params.id), [params.id])
  const addToCart = useCartStore((s) => s.add)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    if (!product) {
      // TODO: Replace with Supabase fetch by slug/id when backend connected
    }
  }, [product])

  if (!product) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Product not found.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <ARErrorBoundary>
            <ModelViewerAR glbUrl={product.modelUrl} poster={product.previewImage} alt={`${product.title} 3D model`} />
          </ARErrorBoundary>
          
          {/* AR Compatibility Check */}
          <ARTest />
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur p-6 rounded-xl border border-slate-700">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{product.title}</h1>
          
          <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Product Details</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
          
          <div className="mt-6 flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{formatInrFromUsdCents(product.priceCents)}</span>
              <span className="text-sm text-slate-400 ml-2">Free shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-400 font-medium">{product.stock} in stock</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-200 mb-3">Select Size</p>
            <div role="listbox" aria-label="Sizes" className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    selectedSize === s
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                      : "bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-500 hover:bg-slate-600"
                  }`}
                  aria-pressed={selectedSize === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              onClick={() =>
                product &&
                selectedSize &&
                addToCart({
                  productId: product.id,
                  title: product.title,
                  priceCents: product.priceCents,
                  qty: 1,
                  size: selectedSize,
                  previewImage: product.previewImage,
                })
              }
              disabled={!selectedSize}
              aria-disabled={!selectedSize}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
            >
              {!selectedSize ? "Select size to add to cart" : `Add to cart - ${formatInrFromUsdCents(product.priceCents)}`}
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Enable AR mode for viewing in space
                  const modelViewer = document.querySelector('model-viewer') as any
                  if (modelViewer) {
                    modelViewer.setAttribute('ar', 'true')
                    modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
                    modelViewer.setAttribute('ar-placement', 'floor')
                    // Trigger AR session
                    modelViewer.activateAR().catch((error: any) => {
                      console.error('AR activation failed:', error)
                      alert('AR not available. Please use a compatible device or browser.')
                    })
                  }
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3"
              >
                🌍 View in AR
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Open try-on modal
                  const modal = document.getElementById('try-on-modal') as HTMLDialogElement
                  if (modal) {
                    modal.showModal()
                  }
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3"
              >
                👤 Virtual Try On
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Try On Modal */}
      <dialog id="try-on-modal" className="backdrop:bg-black/60 bg-slate-900 rounded-lg p-0 max-w-4xl w-full border border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Try On - {product.title}</h2>
            <button
              onClick={() => {
                const modal = document.getElementById('try-on-modal') as HTMLDialogElement
                modal?.close()
              }}
              className="text-slate-400 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>
          <ARErrorBoundary>
            <TryOnComponent 
              product={product}
              selectedSize={selectedSize}
            />
          </ARErrorBoundary>
        </div>
      </dialog>
    </div>
  )
}
