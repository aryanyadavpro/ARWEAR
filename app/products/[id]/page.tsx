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
const MobileARTryon = dynamic(() => import("@/components/mobile-ar-tryon"), { ssr: false })
const TryOn3D = dynamic(() => import("@/components/tryon-3d"), { ssr: false })
const ARTest = dynamic(() => import("@/components/ar-test"), { ssr: false })
const ARDiagnostics = dynamic(() => import("@/components/ar-diagnostics"), { ssr: false })
const AuthDebug = dynamic(() => import("@/components/auth-debug"), { ssr: false })

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const product = useMemo(() => seedProducts.find((p) => p.id === params.id), [params.id])
  const addToCart = useCartStore((s) => s.add)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const router = useRouter()
  const [tryOnMode, setTryOnMode] = useState<'regular' | 'advanced' | 'mobile'>('regular')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!product) {
      // TODO: Replace with Supabase fetch by slug/id when backend connected
    }
  }, [product])

  // Detect mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroidDevice = /Android/i.test(userAgent)
    setIsMobile(isIOSDevice || isAndroidDevice)
    
    // Set default mode based on device
    if (isIOSDevice || isAndroidDevice) {
      setTryOnMode('mobile')
    }
  }, [])

  const handleAddToCart = async () => {
    if (!product || !selectedSize) return
    
    setIsAddingToCart(true)
    try {
      addToCart({
        productId: product.id,
        title: product.title,
        priceCents: product.priceCents,
        qty: 1,
        size: selectedSize,
        previewImage: product.previewImage,
      })
      
      // Show success feedback
      const button = document.querySelector('[data-add-to-cart-btn]') as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = '✅ Added to Cart!'
        button.style.background = 'linear-gradient(to right, #10b981, #059669)'
        
        setTimeout(() => {
          button.textContent = originalText
          button.style.background = ''
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  if (!product) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Product not found.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-4 lg:py-8">
        <div className="mb-4 lg:mb-6">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-200 hover:bg-slate-800 min-h-[44px] touch-manipulation" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        </div>
        <div className="flex flex-col lg:grid gap-6 lg:gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <ARErrorBoundary>
            <ModelViewerAR glbUrl={product.modelUrl} poster={product.previewImage} alt={`${product.title} 3D model`} />
          </ARErrorBoundary>
          
          {/* AR Compatibility Check */}
          <ARTest />
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur p-4 lg:p-6 rounded-xl border border-slate-700">
          <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-4">{product.title}</h1>
          
          <div className="mt-4 p-4 bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Product Details</h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
          
          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div>
              <span className="text-xl lg:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{formatInrFromUsdCents(product.priceCents)}</span>
              <span className="text-sm text-slate-400 ml-2 block sm:inline">Free shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-400 font-medium">{product.stock} in stock</span>
            </div>
          </div>

          <div className="mt-4 lg:mt-6">
            <p className="text-sm font-semibold text-slate-200 mb-3">Select Size</p>
            <div role="listbox" aria-label="Sizes" className="flex flex-wrap gap-3">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-3 rounded-full border-2 font-medium transition-all touch-manipulation min-h-[44px] min-w-[44px] ${
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

          <div className="mt-6 lg:mt-8 space-y-4">
            <Button
              onClick={handleAddToCart}
              disabled={!selectedSize || isAddingToCart}
              aria-disabled={!selectedSize || isAddingToCart}
              data-add-to-cart-btn
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-base lg:text-lg shadow-lg disabled:opacity-50 min-h-[52px] touch-manipulation"
            >
              <span className="text-center">
                {isAddingToCart ? "Adding..." : !selectedSize ? "Select size to add to cart" : `Add to cart - ${formatInrFromUsdCents(product.priceCents)}`}
              </span>
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Check device compatibility first
                    const userAgent = navigator.userAgent
                    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
                    const isAndroid = /android/i.test(userAgent)
                    const isMobileDevice = isIOS || isAndroid
                    
                    if (!isMobileDevice) {
                      alert('📱 AR viewing works best on mobile devices!\n\n• For iPhone/iPad: Use Safari browser\n• For Android: Use Chrome browser\n\nDesktop users can still interact with the 3D model above.')
                      return
                    }

                    // Find the model viewer element
                    const modelViewer = document.querySelector('model-viewer') as any
                    if (!modelViewer) {
                      alert('🔄 3D model is still loading. Please wait a moment and try again.')
                      return
                    }

                    console.log('🚀 Attempting to activate mobile AR...')
                    
                    if (isAndroid) {
                      // Android Scene Viewer approach
                      const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(product.modelUrl)}&mode=ar_only&resizable=false#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`
                      
                      // Try model-viewer AR first
                      if (modelViewer.canActivateAR) {
                        await modelViewer.activateAR()
                      } else {
                        // Direct Scene Viewer fallback
                        console.log('📱 Launching Android Scene Viewer...')
                        window.location.href = sceneViewerUrl
                      }
                    } else if (isIOS) {
                      // iOS Quick Look approach
                      if (modelViewer.canActivateAR) {
                        await modelViewer.activateAR()
                      } else {
                        // Direct Quick Look fallback
                        const quickLookUrl = `${product.modelUrl}#allowsContentScaling=0`
                        const a = document.createElement('a')
                        a.href = quickLookUrl
                        a.rel = 'ar'
                        a.setAttribute('data-action', 'ar')
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }
                    }
                    
                    console.log('✅ AR activation attempt completed')
                    
                  } catch (error: any) {
                    console.error('❌ AR activation failed:', error)
                    
                    let message = '🚫 AR viewing failed to start.\n\n'
                    if (error.message?.includes('not supported')) {
                      message += '• Your device may not support AR\n• Try a newer device with ARCore (Android) or ARKit (iOS)'
                    } else if (error.message?.includes('permission')) {
                      message += '• Camera permission required\n• Please allow camera access in browser settings'
                    } else {
                      message += '• Make sure you\'re using a mobile device\n• Allow camera access when prompted\n• Use Chrome (Android) or Safari (iOS)'
                    }
                    
                    alert(message)
                  }
                }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-3"
              >
                {isMobile ? '📱 View in AR' : '🖥️ View in AR (Mobile Only)'}
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
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold py-4 min-h-[52px] touch-manipulation"
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
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button
                onClick={() => setTryOnMode('mobile')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  tryOnMode === 'mobile'
                    ? 'bg-green-600 text-white shadow-md shadow-green-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                📱 Mobile AR
              </button>
              <button
                onClick={() => setTryOnMode('regular')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  tryOnMode === 'regular'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🎯 Smart Try-On
              </button>
              <button
                onClick={() => setTryOnMode('advanced')}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  tryOnMode === 'advanced'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                🧠 Advanced VR
              </button>
            </div>
            <div className="text-sm text-slate-400">
              {tryOnMode === 'mobile' ? (
                '• Optimized for mobile phones with front camera and touch controls'
              ) : tryOnMode === 'regular' ? (
                '• Quick and smooth AR experience with intelligent body tracking'
              ) : (
                '• Advanced computer vision with body segmentation and precise measurements'
              )}
            </div>
          </div>
          
          <ARErrorBoundary>
            {tryOnMode === 'mobile' ? (
              <MobileARTryon 
                modelUrl={product.modelUrl} 
                className="w-full"
              />
            ) : tryOnMode === 'regular' ? (
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
              {tryOnMode === 'mobile' ? (
                `📱 Mobile-optimized AR with front camera and touch controls for ${product.title}`
              ) : tryOnMode === 'regular' ? (
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
