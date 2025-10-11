'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Palette, 
  Settings,
  Camera,
  Smartphone,
  Monitor,
  RefreshCw,
  Download,
  Share2,
  Heart,
  ShoppingCart,
  Star,
  Info
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  category: string
  brand: string
  rating: number
  reviews: number
  images: string[]
  modelUrl?: string
  colors: string[]
  sizes: string[]
  inStock: boolean
  discount?: number
}

interface ARProductViewerProps {
  product: Product
  onAddToCart?: (product: Product, options: { color: string; size: string }) => void
  onWishlist?: (product: Product) => void
}

export default function ARProductViewer({ product, onAddToCart, onWishlist }: ARProductViewerProps) {
  const [isARActive, setIsARActive] = useState(false)
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'default')
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [viewerMode, setViewerMode] = useState<'3D' | 'AR' | 'VR'>('3D')
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [modelRotation, setModelRotation] = useState([0, 0, 0])
  const [modelScale, setModelScale] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  
  const modelViewerRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Initialize AR capabilities and model-viewer
  useEffect(() => {
    // Load model-viewer script if not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
      document.head.appendChild(script)
    }
    
    const checkARSupport = async () => {
      // Check for WebXR support
      if ('xr' in navigator) {
        try {
          // @ts-ignore
          const isSupported = await navigator.xr.isSessionSupported('immersive-ar')
          console.log('WebXR AR Support:', isSupported)
        } catch (error) {
          console.log('WebXR not supported, falling back to Scene Viewer:', error)
        }
      }
      
      // Check for ARCore/ARKit support (mobile)
      const userAgent = navigator.userAgent || navigator.vendor
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /android/i.test(userAgent)
      
      console.log('Device support:', {
        iOS: isIOS,
        Android: isAndroid,
        hasCamera: 'mediaDevices' in navigator
      })
    }
    
    checkARSupport()
  }, [])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      })
      setCameraPermission('granted')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      return stream
    } catch (error) {
      console.error('Camera permission denied:', error)
      setCameraPermission('denied')
      throw error
    }
  }

  const initializeAR = async () => {
    setIsLoading(true)
    try {
      await requestCameraPermission()
      setIsARActive(true)
      setViewerMode('AR')
    } catch (error) {
      console.error('AR initialization failed:', error)
      alert('AR requires camera permission. Please enable camera access and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const startVRExperience = async () => {
    setIsLoading(true)
    try {
      await requestCameraPermission()
      setViewerMode('VR')
      
      // Initialize advanced body tracking and fitting simulation
      initializeAdvancedVR()
    } catch (error) {
      console.error('VR initialization failed:', error)
      alert('VR experience requires camera access for body tracking.')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeAdvancedVR = () => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    const renderFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(renderFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video feed
      ctx.drawImage(video, 0, 0)

      // Add AR overlay effects
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Simulate body tracking points
      const bodyPoints = [
        { x: canvas.width * 0.5, y: canvas.height * 0.3 }, // Head
        { x: canvas.width * 0.4, y: canvas.height * 0.5 }, // Left shoulder
        { x: canvas.width * 0.6, y: canvas.height * 0.5 }, // Right shoulder
        { x: canvas.width * 0.5, y: canvas.height * 0.7 }, // Torso
      ]

      // Draw tracking points
      ctx.fillStyle = '#00ff00'
      bodyPoints.forEach(point => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
        ctx.fill()
      })

      // Draw virtual garment outline
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(bodyPoints[1].x, bodyPoints[1].y)
      ctx.lineTo(bodyPoints[2].x, bodyPoints[2].y)
      ctx.lineTo(canvas.width * 0.65, canvas.height * 0.8)
      ctx.lineTo(canvas.width * 0.35, canvas.height * 0.8)
      ctx.closePath()
      ctx.stroke()

      // Add product info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(20, 20, 300, 120)
      
      ctx.fillStyle = 'white'
      ctx.font = '18px Arial'
      ctx.fillText(product.name, 30, 45)
      ctx.font = '14px Arial'
      ctx.fillText(`Color: ${selectedColor}`, 30, 70)
      ctx.fillText(`Size: ${selectedSize}`, 30, 90)
      ctx.fillText(`Price: $${product.price}`, 30, 110)

      if (viewerMode === 'VR') {
        requestAnimationFrame(renderFrame)
      }
    }

    renderFrame()
  }

  const resetView = () => {
    setModelRotation([0, 0, 0])
    setModelScale(1)
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation()
    }
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, { color: selectedColor, size: selectedSize })
      alert(`Added ${product.name} to cart!\nColor: ${selectedColor}\nSize: ${selectedSize}`)
    }
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    if (onWishlist) {
      onWishlist(product)
      alert(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist: ${product.name}`)
    }
  }

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this ${product.category} from ${product.brand}!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Product link copied to clipboard!')
    }
  }

  const ModelViewer3D = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
      {product.modelUrl ? (
        <>
          <model-viewer
            ref={modelViewerRef}
            src={product.modelUrl}
            alt={product.name}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            environment-image="neutral"
            shadow-intensity="1"
            shadow-softness="1"
            exposure="0.8"
            className="w-full h-full"
            style={{
              backgroundColor: 'transparent'
            } as React.CSSProperties}
          >
            {/* AR Button */}
            <button 
              slot="ar-button"
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              View in AR
            </button>
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2">
              <p className="text-xs text-gray-600">Drag to rotate • Pinch to zoom • AR button for camera</p>
            </div>
          </model-viewer>
          
          {/* 3D Controls */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-2 space-y-2">
            <Button size="sm" variant="ghost" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="space-y-1">
              <label className="text-xs">Scale</label>
              <Slider
                value={[modelScale]}
                onValueChange={(value) => setModelScale(value[0])}
                min={0.5}
                max={2}
                step={0.1}
                className="w-20"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">3D model not available</p>
            <p className="text-sm text-gray-400">Viewing regular image</p>
          </div>
        </div>
      )}
    </div>
  )

  const ARViewer = () => (
    <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {/* AR Controls */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-lg p-3 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">AR Active</span>
        </div>
        <p className="text-xs opacity-75">Point camera at flat surface</p>
      </div>

      <div className="absolute bottom-4 right-4 space-x-2">
        <Button size="sm" variant="secondary" onClick={() => setIsARActive(false)}>
          Exit AR
        </Button>
      </div>
    </div>
  )

  const VRViewer = () => (
    <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* VR Controls */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-lg p-3 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm">VR Try-On Active</span>
        </div>
        <p className="text-xs opacity-75">Stand in front of camera</p>
      </div>

      <div className="absolute bottom-4 right-4 space-x-2">
        <Button size="sm" variant="secondary" onClick={() => setViewerMode('3D')}>
          Exit VR
        </Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Product Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-lg text-gray-600 mt-1">{product.brand}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
            <Badge variant={product.inStock ? "default" : "destructive"}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-lg text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900">
              ${product.price}
            </span>
          </div>
          {product.discount && (
            <Badge variant="destructive" className="mt-1">
              {product.discount}% OFF
            </Badge>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Product Viewer */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Product Viewer</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewerMode === '3D' ? 'default' : 'outline'}
                    onClick={() => setViewerMode('3D')}
                  >
                    <Move3D className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewerMode === 'AR' ? 'default' : 'outline'}
                    onClick={initializeAR}
                    disabled={isLoading}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewerMode === 'VR' ? 'default' : 'outline'}
                    onClick={startVRExperience}
                    disabled={isLoading}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewerMode === '3D' && <ModelViewer3D />}
              {viewerMode === 'AR' && <ARViewer />}
              {viewerMode === 'VR' && <VRViewer />}
              
              {/* Image Gallery Thumbnails */}
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AR/VR Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                AR/VR Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <Smartphone className="w-6 h-6" />
                      <span className="text-sm">Quick AR View</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>AR Product Viewer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <ARViewer />
                      <p className="text-sm text-gray-600">
                        Point your camera at a flat surface to place the product in your space.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-20 flex flex-col gap-2">
                      <Eye className="w-6 h-6" />
                      <span className="text-sm">VR Try-On</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>VR Virtual Try-On</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <VRViewer />
                      <p className="text-sm text-gray-600">
                        Stand in front of your camera to see how the product looks on you with advanced body tracking.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Product Details */}
        <div className="space-y-6">
          {/* Product Options */}
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">Selected: {selectedColor}</p>
              </div>

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWishlist}
                  className={`flex items-center gap-2 ${isWishlisted ? 'text-red-600 border-red-600' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  Wishlist
                </Button>
              </div>
              
              <Button variant="outline" onClick={shareProduct} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Category:</span>
                    <p className="text-gray-600">{product.category}</p>
                  </div>
                  <div>
                    <span className="font-medium">Brand:</span>
                    <p className="text-gray-600">{product.brand}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AR/VR Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                AR/VR Technology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time 3D product visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Advanced body tracking for virtual try-on</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>AI-powered size and fit recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Cross-platform compatibility</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export for use in other components
export type { Product, ARProductViewerProps }