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
  const [error, setError] = useState<string | null>(null)
  const [modelScale, setModelScale] = useState(1)
  const [modelRotation, setModelRotation] = useState(0)
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, lastFrameTime: 0 })
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (msg: string) => {
    console.log(msg)
    setDebugInfo(prev => [...prev.slice(-5), `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const startCamera = async () => {
    if (cameraRequested) {
      addDebug("Camera already requested, ignoring")
      return
    }
    
    setCameraRequested(true)
    setError(null)
    setIsStreaming(false)
    setDebugInfo([])
    
    try {
      addDebug("Checking getUserMedia support...")
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser")
      }
      
      addDebug("getUserMedia is supported")
      
      // Stop any existing stream
      if (streamRef.current) {
        addDebug("Stopping existing stream")
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Simple constraints that work everywhere
      const constraints = {
        audio: false,
        video: {
          facingMode: "user"
        }
      }
      
      addDebug("Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      addDebug(`Got stream with ${stream.getVideoTracks().length} video tracks`)
      streamRef.current = stream
      
      // Ensure video element exists
      if (!videoRef.current) {
        throw new Error("Video element not found")
      }
      
      const video = videoRef.current
      addDebug("Setting video srcObject...")
      
      // Set all necessary attributes first
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      video.autoplay = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      
      addDebug("Waiting for loadedmetadata event...")
      
      // Wait for metadata with timeout
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            addDebug(`Metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
            resolve()
          }
          video.onerror = (e) => {
            addDebug(`Video error: ${e}`)
            reject(new Error('Video element error'))
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metadata load timeout after 10s')), 10000)
        )
      ])
      
      addDebug("Attempting to play video...")
      
      try {
        await video.play()
        addDebug("Video.play() succeeded!")
      } catch (playErr: any) {
        addDebug(`Play error: ${playErr.message}, trying user interaction...`)
        // Sometimes autoplay is blocked, try again
        setTimeout(() => {
          video.play()
            .then(() => addDebug("Delayed play succeeded"))
            .catch(e => addDebug(`Delayed play failed: ${e.message}`))
        }, 100)
      }
      
      // Give it a moment to start playing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if actually playing
      if (video.paused) {
        addDebug("Video is paused, forcing play...")
        await video.play()
      }
      
      addDebug("Camera setup complete!")
      setIsStreaming(true)
      
    } catch (err: any) {
      addDebug(`Error: ${err.message}`)
      console.error("Camera error:", err)
      
      let errorMessage = "Camera access failed. "
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access."
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found."
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use."
      } else if (err.message?.includes('timeout')) {
        errorMessage = "Camera initialization timeout. Please try again."
      } else {
        errorMessage += err.message
      }
      
      setError(errorMessage)
      setCameraRequested(false)
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  const stopCamera = () => {
    addDebug("Stopping camera...")
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setCameraRequested(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const drawModelOverlay = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video || !isStreaming) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (video.videoWidth === 0 || video.videoHeight === 0) return

    // Match canvas to video size
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((modelRotation * Math.PI) / 180)
    ctx.translate(-centerX, -centerY)

    if (product.category === "shirt") {
      // More realistic shirt proportions
      const shirtWidth = canvas.width * 0.5 * modelScale
      const shirtHeight = canvas.height * 0.45 * modelScale
      const shirtX = centerX - shirtWidth / 2
      const shirtY = canvas.height * 0.15 // Position at upper body

      // Create gradient for depth
      const gradient = ctx.createLinearGradient(shirtX, shirtY, shirtX + shirtWidth, shirtY + shirtHeight)
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.75)')
      gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.8)')
      gradient.addColorStop(1, 'rgba(30, 64, 175, 0.75)')

      // Main shirt body with rounded corners
      ctx.globalAlpha = 0.85
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(shirtX, shirtY, shirtWidth, shirtHeight, 8)
      ctx.fill()

      // Sleeves - more natural proportions
      const sleeveWidth = shirtWidth * 0.22
      const sleeveHeight = shirtHeight * 0.65
      const sleeveY = shirtY + shirtHeight * 0.05
      
      // Left sleeve
      ctx.beginPath()
      ctx.roundRect(shirtX - sleeveWidth * 0.8, sleeveY, sleeveWidth, sleeveHeight, 6)
      ctx.fill()
      
      // Right sleeve
      ctx.beginPath()
      ctx.roundRect(shirtX + shirtWidth - sleeveWidth * 0.2, sleeveY, sleeveWidth, sleeveHeight, 6)
      ctx.fill()

      // Collar with better styling
      ctx.globalAlpha = 0.9
      ctx.fillStyle = "rgba(30, 64, 175, 0.9)"
      const collarWidth = shirtWidth * 0.4
      const collarHeight = shirtHeight * 0.12
      ctx.beginPath()
      ctx.roundRect(centerX - collarWidth / 2, shirtY, collarWidth, collarHeight, 4)
      ctx.fill()
      
      // V-neck detail
      ctx.beginPath()
      ctx.moveTo(centerX, shirtY)
      ctx.lineTo(centerX - collarWidth * 0.3, shirtY + collarHeight)
      ctx.lineTo(centerX + collarWidth * 0.3, shirtY + collarHeight)
      ctx.closePath()
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.fill()
      
      // Buttons
      ctx.fillStyle = "white"
      ctx.globalAlpha = 1.0
      const buttonCount = 4
      for (let i = 0; i < buttonCount; i++) {
        const buttonY = shirtY + collarHeight + (shirtHeight - collarHeight) * (i / (buttonCount - 1)) * 0.8
        ctx.beginPath()
        ctx.arc(centerX, buttonY, 4, 0, 2 * Math.PI)
        ctx.fill()
        
        // Button holes
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Add some seam lines for realism
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX, shirtY + collarHeight)
      ctx.lineTo(centerX, shirtY + shirtHeight)
      ctx.stroke()

    } else if (product.category === "pants") {
      // More realistic pants proportions
      const pantsWidth = canvas.width * 0.45 * modelScale
      const pantsHeight = canvas.height * 0.55 * modelScale
      const pantsX = centerX - pantsWidth / 2
      const pantsY = canvas.height * 0.4 // Position at lower body

      // Create gradient
      const gradient = ctx.createLinearGradient(pantsX, pantsY, pantsX, pantsY + pantsHeight)
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)')
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.85)')
      gradient.addColorStop(1, 'rgba(109, 40, 217, 0.8)')

      // Waist/belt area
      const waistHeight = pantsHeight * 0.08
      ctx.globalAlpha = 0.9
      ctx.fillStyle = "rgba(139, 69, 19, 0.9)"
      ctx.beginPath()
      ctx.roundRect(pantsX, pantsY, pantsWidth, waistHeight, 4)
      ctx.fill()

      // Belt buckle
      ctx.fillStyle = "rgba(192, 192, 192, 0.9)"
      ctx.beginPath()
      ctx.roundRect(centerX - 8, pantsY + waistHeight * 0.2, 16, waistHeight * 0.6, 2)
      ctx.fill()

      // Main pants body
      ctx.globalAlpha = 0.85
      ctx.fillStyle = gradient
      
      // Pants legs - more natural shape
      const legGap = pantsWidth * 0.05
      const legWidth = (pantsWidth - legGap) / 2
      const legHeight = pantsHeight * 0.85
      const legY = pantsY + waistHeight
      
      // Left leg with taper
      ctx.beginPath()
      ctx.moveTo(pantsX, legY)
      ctx.lineTo(pantsX + legWidth * 0.95, legY)
      ctx.lineTo(pantsX + legWidth * 0.85, legY + legHeight)
      ctx.lineTo(pantsX + legWidth * 0.1, legY + legHeight)
      ctx.closePath()
      ctx.fill()
      
      // Right leg with taper
      ctx.beginPath()
      ctx.moveTo(pantsX + legWidth + legGap, legY)
      ctx.lineTo(pantsX + pantsWidth, legY)
      ctx.lineTo(pantsX + pantsWidth - legWidth * 0.1, legY + legHeight)
      ctx.lineTo(pantsX + legWidth + legGap + legWidth * 0.15, legY + legHeight)
      ctx.closePath()
      ctx.fill()

      // Seam lines
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 2
      
      // Center seam
      ctx.beginPath()
      ctx.moveTo(centerX, pantsY + waistHeight)
      ctx.lineTo(centerX, legY + legHeight * 0.3)
      ctx.stroke()
      
      // Pocket outlines
      const pocketSize = pantsWidth * 0.15
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
      ctx.lineWidth = 1
      // Left pocket
      ctx.strokeRect(pantsX + legWidth * 0.2, pantsY + waistHeight * 1.5, pocketSize, pocketSize * 0.8)
      // Right pocket
      ctx.strokeRect(pantsX + pantsWidth - legWidth * 0.2 - pocketSize, pantsY + waistHeight * 1.5, pocketSize, pocketSize * 0.8)
    }

    ctx.restore()

    if (selectedSize) {
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.fillText(`Size: ${selectedSize}`, 10, 30)
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(10, canvas.height - 60, 200, 50)
    ctx.fillStyle = "white"
    ctx.font = "12px Arial"
    ctx.fillText(`Scale: ${modelScale.toFixed(1)}`, 15, canvas.height - 40)
    ctx.fillText(`Rotation: ${modelRotation}°`, 15, canvas.height - 25)
    ctx.fillText(`FPS: ${performanceStats.fps}`, 15, canvas.height - 10)
  }

  useEffect(() => {
    if (!isStreaming) return

    let frameCount = 0
    let lastFpsUpdate = performance.now()
    
    const animate = () => {
      const now = performance.now()
      drawModelOverlay()
      
      frameCount++
      if (now - lastFpsUpdate >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
        setPerformanceStats({ fps, lastFrameTime: now })
        frameCount = 0
        lastFpsUpdate = now
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isStreaming, modelScale, modelRotation, product.category, selectedSize])

  const adjustScale = (delta: number) => {
    setModelScale(prev => Math.max(0.5, Math.min(2, prev + delta)))
  }

  const adjustRotation = (delta: number) => {
    setModelRotation(prev => (prev + delta) % 360)
  }

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
          <p className="text-xs text-slate-400 mt-2">We'll ask for camera permission</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-white mb-2">Camera Access Issue</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setCameraRequested(false)
              startCamera()
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700"
          >
            Try Again
          </button>
          
          {debugInfo.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800 border border-slate-600 rounded text-xs text-left">
              <p className="font-bold text-slate-300 mb-1">Debug Log:</p>
              {debugInfo.map((log, i) => (
                <div key={i} className="text-slate-400 font-mono">{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative aspect-video border rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{ 
              transform: 'scaleX(-1)',
              zIndex: 1
            }}
          />
          
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ 
              pointerEvents: "none",
              transform: 'scaleX(-1)',
              zIndex: 2
            }}
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-slate-300">Starting camera...</p>
              {debugInfo.length > 0 && (
                <div className="mt-4 p-3 bg-slate-800/80 border border-slate-600 rounded text-xs max-w-md">
                  <p className="font-bold text-slate-300 mb-1">Debug:</p>
                  {debugInfo.slice(-3).map((log, i) => (
                    <div key={i} className="text-slate-400 font-mono text-[10px]">{log}</div>
                  ))}
                </div>
              )}
              <button
                onClick={stopCamera}
                className="mt-2 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
          
          <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-sm z-20">
            <p>Position yourself in center</p>
            <p>Size: {selectedSize || "Select size"}</p>
            <p className={isStreaming ? "text-green-400" : "text-yellow-400"}>
              Camera: {isStreaming ? "Active" : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <button onClick={() => adjustScale(-0.1)} className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">-</button>
          <span className="text-sm text-slate-300">Scale</span>
          <button onClick={() => adjustScale(0.1)} className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">+</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => adjustRotation(-15)} className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">↺</button>
          <span className="text-sm text-slate-300">Rotate</span>
          <button onClick={() => adjustRotation(15)} className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">↻</button>
        </div>

        <button
          onClick={() => {
            const video = videoRef.current
            const canvas = document.createElement('canvas')
            if (video && video.videoWidth > 0) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.save()
                ctx.scale(-1, 1)
                ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
                ctx.restore()
                
                const overlayCanvas = canvasRef.current
                if (overlayCanvas) {
                  ctx.save()
                  ctx.scale(-1, 1)
                  ctx.drawImage(overlayCanvas, -canvas.width, 0, canvas.width, canvas.height)
                  ctx.restore()
                }
                
                const link = document.createElement('a')
                link.download = `try-on-${product.title}.png`
                link.href = canvas.toDataURL()
                link.click()
              }
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded hover:from-green-700 hover:to-emerald-700"
        >
          📸 Capture
        </button>
        
        <button
          onClick={stopCamera}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded hover:from-red-700 hover:to-rose-700"
        >
          🚫 Stop Camera
        </button>
      </div>

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