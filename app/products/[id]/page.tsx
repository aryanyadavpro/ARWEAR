"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { formatInrFromUsdCents } from "@/lib/utils"
import { useCartStore } from "@/store/cart-store"
import { seedProducts } from "@/data/seed-products"
import dynamic from "next/dynamic"
import ARErrorBoundary from "@/components/ar-error-boundary"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const ModelViewerAR = dynamic(() => import("@/components/model-viewer-ar"), { ssr: false })
const TryOnComponent = dynamic(() => import("@/components/try-on-component"), { ssr: false })
const ARVirtualTryon = dynamic(() => import("@/components/ar-virtual-tryon"), { ssr: false })
const AdvancedVRTryon = dynamic(() => import("@/components/advanced-vr-tryon"), { ssr: false })
const TryOn3D = dynamic(() => import("@/components/tryon-3d"), { ssr: false })
const ARTest = dynamic(() => import("@/components/ar-test"), { ssr: false })
const ARDiagnostics = dynamic(() => import("@/components/ar-diagnostics"), { ssr: false })
const AuthDebug = dynamic(() => import("@/components/auth-debug"), { ssr: false })

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const product = useMemo(() => seedProducts.find((p) => p.id === params.id), [params.id])
  const addToCart = useCartStore((s) => s.add)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const router = useRouter()
  const [tryOnMode, setTryOnMode] = useState<'regular' | 'advanced'>('regular')

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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
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
                onClick={async () => {
                  // Find the model viewer element
                  const modelViewer = document.querySelector('model-viewer') as any
                  if (!modelViewer) {
                    alert('3D model is loading. Please wait and try again.')
                    return
                  }

                  try {
                    console.log('Attempting to activate AR...')
                    console.log('Model viewer AR capable:', modelViewer.canActivateAR)
                    
                    // Check device compatibility
                    const userAgent = navigator.userAgent
                    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
                    const isAndroid = /android/i.test(userAgent)
                    const isMobile = isIOS || isAndroid
                    
                    if (!isMobile) {
                      alert('AR viewing is best on mobile devices (iPhone/iPad or Android). For desktop, you can still rotate and interact with the 3D model above.')
                      return
                    }
                    
                    // Ensure AR attributes are set
                    modelViewer.setAttribute('ar', 'true')
                    modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
                    modelViewer.setAttribute('ar-placement', 'floor')
                    modelViewer.setAttribute('ar-scale', 'auto')
                    
                    // Wait a moment for attributes to be processed
                    await new Promise(resolve => setTimeout(resolve, 500))
                    
                    // Activate AR
                    if (modelViewer.canActivateAR) {
                      await modelViewer.activateAR()
                      console.log('AR activated successfully')
                    } else {
                      throw new Error('AR not supported on this device')
                    }
                    
                  } catch (error: any) {
                    console.error('AR activation failed:', error)
                    
                    let message = 'AR viewing is not available. '
                    if (error.message?.includes('not supported')) {
                      message += 'This device may not support AR. Try using a newer mobile device with ARCore (Android) or ARKit (iOS) support.'
                    } else if (error.message?.includes('permission')) {
                      message += 'Camera permission is required. Please allow camera access and try again.'
                    } else {
                      message += 'Please try:\n• Using a mobile device\n• Allowing camera access\n• Using Chrome (Android) or Safari (iOS)'
                    }
                    
                    alert(message)
                  }
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3"
              >
                📱 View in AR
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
      </div>
      
      {/* Try On Modal */}
      <dialog id="try-on-modal" className="backdrop:bg-black/60 bg-slate-900 rounded-lg p-0 max-w-6xl w-full max-h-[95vh] border border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Virtual Try-On Experience</h2>
              <p className="text-slate-400 text-sm mt-1">{product.title} {selectedSize ? `- Size ${selectedSize}` : ''}</p>
            </div>
            <button
              onClick={() => {
                const modal = document.getElementById('try-on-modal') as HTMLDialogElement
                modal?.close()
              }}
              className="text-slate-400 hover:text-white text-2xl transition-colors p-2 hover:bg-slate-800 rounded"
            >
              ×
            </button>
          </div>
          
          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setTryOnMode('regular')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  tryOnMode === 'regular'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🎯 Smart Try-On
              </button>
              <button
                onClick={() => setTryOnMode('advanced')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  tryOnMode === 'advanced'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🧠 Advanced VR
              </button>
            </div>
            <div className="text-sm text-slate-400">
              {tryOnMode === 'regular' ? (
                '• Quick and smooth AR experience with intelligent body tracking'
              ) : (
                '• Advanced computer vision with body segmentation and precise measurements'
              )}
            </div>
          </div>
          
          <ARErrorBoundary>
            {tryOnMode === 'regular' ? (
              <ARVirtualTryon 
                modelUrl={product.modelUrl} 
                className="w-full"
              />
            ) : (
              <AdvancedVRTryon 
                modelUrl={product.modelUrl} 
                className="w-full"
              />
            )}
          </ARErrorBoundary>
          
          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              {tryOnMode === 'regular' ? (
                `💡 Move naturally to see how ${product.title} fits and looks on you`
              ) : (
                '🔬 Advanced AI tracks your body precisely for the most realistic fitting experience'
              )}
            </p>
          </div>
        </div>
      </dialog>
      
      {/* AR Diagnostics - floating button */}
      <ARDiagnostics />
      
      {/* Auth Debug - floating button */}
      <AuthDebug />
    </div>
  )
}
