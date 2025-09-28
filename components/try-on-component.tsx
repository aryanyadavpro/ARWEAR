"use client"

import { useEffect, useRef, useState } from "react"

type Product = {
  id: string
  title: string
  description: string
  category: "shirt" | "pants"
  sizes: string[]
  priceCents: number
  stock: number
  previewImage: string
  modelUrl: string
}

type TryOnComponentProps = {
  product: Product
  selectedSize: string | null
}

export default function TryOnComponent({ product, selectedSize }: TryOnComponentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraRequested, setCameraRequested] = useState(false)
  const [requestingPermission, setRequestingPermission] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelScale, setModelScale] = useState(1)
  const [modelRotation, setModelRotation] = useState(0)
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isAndroid: false })
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, lastFrameTime: 0 })

  // Detect device type
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)
    setDeviceInfo({ isMobile, isAndroid })
  }, [])

  const getOptimalConstraints = () => {
    // Start with the most basic constraints that work everywhere
    const basicConstraints = {
      audio: false,
      video: {
        facingMode: "user"
      }
    }

    // Try more specific constraints for desktop
    if (!deviceInfo.isMobile) {
      return {
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640, max: 1280, min: 320 },
          height: { ideal: 480, max: 960, min: 240 },
          frameRate: { ideal: 30, max: 60, min: 15 }
        }
      }
    }

    // Mobile gets basic constraints for maximum compatibility
    return basicConstraints
  }

  const startCamera = async () => {
    if (cameraRequested || requestingPermission) return
    
    setRequestingPermission(true)
    setCameraRequested(true)
    setError(null)
    setVideoReady(false)
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }
      
      // Check for HTTPS or localhost (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error("Camera access requires HTTPS or localhost")
      }
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const constraints = getOptimalConstraints()
      console.log('Using camera constraints:', constraints)
      
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Camera access timeout")), 15000)
      )
      
      const cameraPromise = navigator.mediaDevices.getUserMedia(constraints)
      
      // Race between camera access and timeout
      const stream = await Promise.race([cameraPromise, timeout]) as MediaStream
      streamRef.current = stream
      
      console.log('Stream obtained:', stream.getVideoTracks())

      if (videoRef.current && stream) {
        // Set up video element event listeners
        const video = videoRef.current
        
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight)
          setVideoReady(true)
        }
        
        video.oncanplay = () => {
          console.log('Video can play')
          setIsStreaming(true)
        }
        
        video.onplaying = () => {
          console.log('Video is playing')
          setIsStreaming(true)
        }
        
        video.onloadstart = () => {
          console.log('Video load started')
        }
        
        video.onerror = (e) => {
          console.error('Video error:', e)
          setError('Video playback error')
        }
        
        // Set video properties for maximum compatibility
        video.srcObject = stream
        video.playsInline = true
        video.muted = true
        video.autoplay = true
        video.controls = false
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        
        // Force video to load and play
        video.load()
        
        // Try to play the video
        try {
          await video.play()
          console.log('Video started playing')
        } catch (playError) {
          console.error('Video play error:', playError)
          // Try to play again after a small delay
          setTimeout(async () => {
            try {
              await video.play()
            } catch (retryError) {
              console.error('Retry play failed:', retryError)
              setError('Failed to start video playback')
            }
          }, 500)
        }
        
        // Fallback: Force video to start after a delay if it's still not playing
        setTimeout(() => {
          if (video.paused && !video.ended) {
            console.log('Forcing video to play...')
            video.play().catch(err => console.error('Force play failed:', err))
          }
        }, 2000)
      }
    } catch (err: any) {
      console.error("Camera access error:", err)
      let errorMessage = "Camera access failed. "
      
      if (err.message === "Camera access timeout") {
        errorMessage = "Camera access timed out. Please try again."
      } else if (err.message === "Camera not supported in this browser") {
        errorMessage = "Camera not supported. Please use Chrome, Safari, or Firefox."
      } else if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found. Please check your camera connection."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is in use. Please close other apps using the camera."
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Camera constraints not supported. Trying with basic settings..."
        // Retry with basic constraints
        setTimeout(() => retryWithBasicConstraints(), 1000)
        return
      } else if (err.message === "Camera access requires HTTPS or localhost") {
        errorMessage = "Camera access requires HTTPS or localhost. Please use a secure connection."
      } else if (err.name === "AbortError") {
        errorMessage = "Camera access was interrupted. Please try again."
      } else if (err.name === "SecurityError") {
        errorMessage = "Camera access blocked by security policy. Please check browser settings."
      } else {
        errorMessage += err.message || "Unknown error occurred."
      }
      
      setError(errorMessage)
    } finally {
      setRequestingPermission(false)
    }
  }
  
  const retryWithBasicConstraints = async () => {
    try {
      setError(null)
      setRequestingPermission(true)
      
      // Progressive fallback constraints - start with absolute basics
      const fallbackConstraints = [
        // Absolute minimum - just video
        { video: true, audio: false },
        // Just facing mode
        { video: { facingMode: "user" }, audio: false },
        // Basic size
        { video: { facingMode: "user", width: 320 }, audio: false },
        // Even more basic
        { video: { width: 320 }, audio: false }
      ]
      
      let stream = null
      let lastError = null
      
      // Try each constraint level
      for (const constraints of fallbackConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('Camera opened with fallback constraints:', constraints)
          break
        } catch (err) {
          lastError = err
          console.log('Fallback constraint failed:', constraints, err)
        }
      }
      
      if (!stream) {
        throw lastError || new Error('All camera constraints failed')
      }
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setVideoReady(true)
        videoRef.current.oncanplay = () => setIsStreaming(true)
        await videoRef.current.play()
      }
    } catch (retryErr: any) {
      console.error('All camera fallbacks failed:', retryErr)
      setError('Unable to access camera. Please check permissions and try again.')
    } finally {
      setRequestingPermission(false)
    }
  }

  const stopCamera = () => {
    // Stop animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      streamRef.current = null
    }
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
      videoRef.current.onerror = null
    }
    
    setIsStreaming(false)
    setVideoReady(false)
  }

  // Cleanup on unmount and handle modal close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        stopCamera()
        const modal = document.getElementById('try-on-modal') as HTMLDialogElement
        modal?.close()
      }
    }

    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      stopCamera()
    }
  }, [])

  const drawModelOverlay = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !isStreaming || !videoReady) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    // Set canvas size to match display dimensions for better performance
    const rect = canvas.getBoundingClientRect()
    const displayWidth = Math.floor(rect.width)
    const displayHeight = Math.floor(rect.height)
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
      console.log('Canvas resized to display size:', canvas.width, 'x', canvas.height)
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // Draw video frame scaled to canvas size
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    } catch (drawError) {
      console.warn('Failed to draw video frame:', drawError)
      return
    }

    // Calculate model position based on body parts
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw 3D model overlay (enhanced visual representation)
    ctx.save()
    
    // Apply rotation transform
    ctx.translate(centerX, centerY)
    ctx.rotate((modelRotation * Math.PI) / 180)
    ctx.translate(-centerX, -centerY)

    if (product.category === "shirt") {
      // Draw shirt overlay on upper body with gradient and shadows
      const shirtWidth = canvas.width * 0.4 * modelScale
      const shirtHeight = canvas.height * 0.5 * modelScale
      const shirtX = centerX - shirtWidth / 2
      const shirtY = centerY - shirtHeight * 0.4

      // Create gradient for shirt
      const gradient = ctx.createLinearGradient(shirtX, shirtY, shirtX + shirtWidth, shirtY + shirtHeight)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#1e40af')

      // Draw shadow first
      ctx.globalAlpha = 0.3
      ctx.fillStyle = "black"
      ctx.fillRect(shirtX + 5, shirtY + 5, shirtWidth, shirtHeight)

      // Draw main shirt body
      ctx.globalAlpha = 0.8
      ctx.fillStyle = gradient
      ctx.fillRect(shirtX, shirtY, shirtWidth, shirtHeight)

      // Shirt sleeves with rounded ends
      const sleeveWidth = shirtWidth * 0.25
      const sleeveHeight = shirtHeight * 0.7
      ctx.fillRect(shirtX - sleeveWidth, shirtY + shirtHeight * 0.1, sleeveWidth, sleeveHeight)
      ctx.fillRect(shirtX + shirtWidth, shirtY + shirtHeight * 0.1, sleeveWidth, sleeveHeight)

      // Shirt collar with highlighting
      ctx.globalAlpha = 0.9
      ctx.fillStyle = "#1e40af"
      ctx.fillRect(shirtX + shirtWidth * 0.25, shirtY, shirtWidth * 0.5, shirtHeight * 0.15)
      
      // Add buttons
      ctx.fillStyle = "white"
      ctx.globalAlpha = 1.0
      for (let i = 0; i < 3; i++) {
        const buttonY = shirtY + shirtHeight * (0.2 + i * 0.2)
        ctx.beginPath()
        ctx.arc(centerX, buttonY, 3, 0, 2 * Math.PI)
        ctx.fill()
      }

    } else if (product.category === "pants") {
      // Draw pants overlay on lower body with improved styling
      const pantsWidth = canvas.width * 0.35 * modelScale
      const pantsHeight = canvas.height * 0.6 * modelScale
      const pantsX = centerX - pantsWidth / 2
      const pantsY = centerY

      // Create gradient for pants
      const gradient = ctx.createLinearGradient(pantsX, pantsY, pantsX, pantsY + pantsHeight)
      gradient.addColorStop(0, '#8b5cf6')
      gradient.addColorStop(1, '#6d28d9')

      // Draw shadow
      ctx.globalAlpha = 0.3
      ctx.fillStyle = "black"
      ctx.fillRect(pantsX + 3, pantsY + 3, pantsWidth, pantsHeight * 0.4)

      // Pants waist
      ctx.globalAlpha = 0.8
      ctx.fillStyle = gradient
      ctx.fillRect(pantsX, pantsY, pantsWidth, pantsHeight * 0.4)

      // Pants legs with improved proportions
      const legWidth = pantsWidth * 0.45
      const legHeight = pantsHeight * 0.7
      const legY = pantsY + pantsHeight * 0.25
      
      ctx.fillRect(pantsX + pantsWidth * 0.02, legY, legWidth, legHeight)
      ctx.fillRect(pantsX + pantsWidth * 0.53, legY, legWidth, legHeight)
      
      // Add belt
      ctx.fillStyle = "#8b4513"
      ctx.globalAlpha = 0.9
      ctx.fillRect(pantsX, pantsY, pantsWidth, pantsHeight * 0.05)
    }

    ctx.restore()

    // Draw size indicator
    if (selectedSize) {
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.fillText(`Size: ${selectedSize}`, 10, 30)
    }

    // Draw model controls and performance info
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, canvas.height - 80, 250, 70)
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.fillText(`Scale: ${modelScale.toFixed(1)}`, 15, canvas.height - 60)
    ctx.fillText(`Rotation: ${modelRotation}°`, 15, canvas.height - 45)
    ctx.fillText(`FPS: ${performanceStats.fps}`, 15, canvas.height - 30)
    ctx.fillText(`Quality: ${performanceStats.fps > 25 ? 'Good' : performanceStats.fps > 15 ? 'Fair' : 'Poor'}`, 15, canvas.height - 15)
  }

  useEffect(() => {
    if (!isStreaming) return

    let frameCount = 0
    let lastFpsUpdate = window.performance.now()
    
    // Use requestAnimationFrame for smooth rendering with FPS monitoring
    const animate = () => {
      const now = window.performance.now()
      drawModelOverlay()
      
      // Calculate FPS every second
      frameCount++
      if (now - lastFpsUpdate >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
        setPerformanceStats(prev => ({ ...prev, fps, lastFrameTime: now }))
        frameCount = 0
        lastFpsUpdate = now
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isStreaming, modelScale, modelRotation, product.category, selectedSize, videoReady])

  const adjustScale = (delta: number) => {
    setModelScale(prev => Math.max(0.5, Math.min(2, prev + delta)))
  }

  const adjustRotation = (delta: number) => {
    setModelRotation(prev => (prev + delta) % 360)
  }

  // Initial state - show start button
  if (!cameraRequested && !error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-white mb-2">Virtual Try-On</h3>
          <p className="text-slate-300 mb-4">See how {product.title} looks on you!</p>
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg"
          >
            Start Camera
          </button>
          <p className="text-xs text-slate-400 mt-2">We'll ask for camera permission to begin</p>
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
            <p className="text-blue-400 font-medium">Device Info:</p>
            <p className="text-blue-300 text-xs">
              Mobile: {deviceInfo.isMobile ? 'Yes' : 'No'} | 
              Android: {deviceInfo.isAndroid ? 'Yes' : 'No'} | 
              Protocol: {location.protocol}
            </p>
          </div>
          {!deviceInfo.isMobile && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
              <p className="text-yellow-400 font-medium">Best Experience:</p>
              <p className="text-yellow-300">For optimal results, use a mobile device with good lighting</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Requesting permission state
  if (requestingPermission) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Requesting camera permission...</p>
          <p className="text-sm text-slate-400 mt-2">Please allow camera access to use the virtual try-on feature</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-white mb-2">Camera Access Required</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null)
                setCameraRequested(false)
                startCamera()
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 mr-2"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                const modal = document.getElementById('try-on-modal') as HTMLDialogElement
                modal?.close()
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              Close
            </button>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-left">
            <p className="font-medium text-yellow-400">Troubleshooting:</p>
            <ul className="text-yellow-300 mt-1 space-y-1">
              <li>• Check browser permissions for camera access</li>
              <li>• Make sure you're using HTTPS or localhost</li>
              <li>• Try a different browser if the issue persists</li>
              <li>• Ensure no other apps are using the camera</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Camera requested but not streaming yet
  if (cameraRequested && !isStreaming && !error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Starting camera...</p>
          <p className="text-sm text-slate-400 mt-2">Please wait while we initialize your camera</p>
          <button
            onClick={() => {
              stopCamera()
              setCameraRequested(false)
              setError(null)
            }}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Camera View */}
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative aspect-video border rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{ 
              transform: 'scaleX(-1)', // Mirror the video for natural feel
              zIndex: 1
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
          />
          
          {/* Overlay Instructions */}
          <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-sm">
            <p>Position yourself in the center</p>
            <p>Size: {selectedSize || "Select size"}</p>
            <p className="text-green-400">Camera: {isStreaming ? "Active" : "Loading..."}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustScale(-0.1)}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
          >
            -
          </button>
          <span className="text-sm text-slate-300">Scale</span>
          <button
            onClick={() => adjustScale(0.1)}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustRotation(-15)}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
          >
            ↺
          </button>
          <span className="text-sm text-slate-300">Rotate</span>
          <button
            onClick={() => adjustRotation(15)}
            className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"
          >
            ↻
          </button>
        </div>

        <button
          onClick={() => {
            const canvas = canvasRef.current
            if (canvas) {
              const link = document.createElement('a')
              link.download = `try-on-${product.title}.png`
              link.href = canvas.toDataURL()
              link.click()
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700 font-medium shadow-lg"
        >
          📸 Capture
        </button>
        
        <button
          onClick={() => {
            stopCamera()
            setCameraRequested(false)
            setError(null)
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded hover:from-red-700 hover:to-rose-700 font-medium shadow-lg"
        >
          🚫 Stop Camera
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur border border-slate-600 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-2">Try On Instructions:</h4>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Position yourself in the center of the camera view</li>
          <li>• Use the scale and rotate controls to adjust the fit</li>
          <li>• Make sure you have good lighting for best results</li>
          <li>• Click "Capture" to save your try-on photo</li>
        </ul>
      </div>
    </div>
  )
}

