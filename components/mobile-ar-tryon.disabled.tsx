"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as posedetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"
import { Button } from "./ui/button"
import { Camera, Download, RotateCcw, ZoomIn, ZoomOut, Move } from "lucide-react"

type Props = {
  modelUrl: string
  onReadyChange?: (ready: boolean) => void
  className?: string
}

interface MobileBodyFit {
  centerX: number
  centerY: number
  shoulderWidth: number
  torsoLength: number
  hipWidth: number
  angle: number
  confidence: number
  scale: number
}

export default function MobileARTryon({ modelUrl, onReadyChange, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const detectorRef = useRef<posedetection.PoseDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Starting mobile AR...")
  const [isCapturing, setIsCapturing] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, browser: '' })
  
  // Mobile-specific controls
  const [modelScale, setModelScale] = useState(1.0)
  const [modelRotation, setModelRotation] = useState(0)
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0 })
  const [trackingQuality, setTrackingQuality] = useState(0)

  // Initialize device detection
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const browser = isIOS && /Safari/.test(userAgent) && !/Chrome/.test(userAgent) ? 'Safari' :
                   isAndroid && /Chrome/.test(userAgent) ? 'Chrome' :
                   /Chrome/.test(userAgent) ? 'Chrome' : 'Other'
    
    setDeviceInfo({ isIOS, isAndroid, browser })
  }, [])

  // Mobile-optimized body measurements
  const calculateMobileBodyFit = useCallback((poses: any[]): MobileBodyFit | null => {
    if (!poses[0] || !poses[0].keypoints) return null
    
    const keypoints = poses[0].keypoints
    const leftShoulder = keypoints.find((kp: any) => kp.name === "left_shoulder")
    const rightShoulder = keypoints.find((kp: any) => kp.name === "right_shoulder")
    const leftHip = keypoints.find((kp: any) => kp.name === "left_hip")
    const rightHip = keypoints.find((kp: any) => kp.name === "right_hip")
    
    // Stricter confidence thresholds for mobile
    const minConfidence = 0.6
    if (!leftShoulder || !rightShoulder || 
        leftShoulder.score < minConfidence || rightShoulder.score < minConfidence) {
      return null
    }
    
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
    const shoulderWidth = Math.hypot(
      rightShoulder.x - leftShoulder.x,
      rightShoulder.y - leftShoulder.y
    )
    const angle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    )
    
    // Calculate torso measurements
    let torsoLength = shoulderWidth * 1.4
    let hipWidth = shoulderWidth * 0.9
    
    if (leftHip && rightHip && leftHip.score > 0.5 && rightHip.score > 0.5) {
      const hipCenterY = (leftHip.y + rightHip.y) / 2
      torsoLength = Math.abs(hipCenterY - shoulderCenterY)
      hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
    }
    
    const confidence = Math.min(leftShoulder.score, rightShoulder.score)
    
    // Mobile-optimized scaling
    const baseScale = deviceInfo.isIOS ? 0.8 : 0.9 // iOS tends to need smaller scale
    const scale = baseScale + (confidence - 0.6) * 0.5
    
    return {
      centerX: shoulderCenterX,
      centerY: shoulderCenterY,
      shoulderWidth,
      torsoLength,
      hipWidth,
      angle,
      confidence,
      scale: Math.max(0.5, Math.min(1.5, scale))
    }
  }, [deviceInfo])

  // Apply mobile-optimized fitting
  const applyMobileFit = useCallback((measurements: MobileBodyFit, videoWidth: number, videoHeight: number) => {
    const model = modelRef.current
    const renderer = rendererRef.current
    if (!model || !renderer) return

    const aspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight)
    
    // Convert to normalized coordinates
    const ndcX = (measurements.centerX / videoWidth) * 2 - 1
    const ndcY = -(measurements.centerY / videoHeight) * 2 + 1
    
    // Apply manual position adjustments
    const worldX = (ndcX * aspect) + (modelPosition.x * 0.01)
    const worldY = ndcY + (modelPosition.y * 0.01)
    
    model.position.set(worldX, worldY, 0)
    
    // Apply rotation with manual adjustment
    model.rotation.set(0, 0, measurements.angle + (modelRotation * Math.PI / 180))
    
    // Calculate adaptive scaling for clothing
    let scaleX = (measurements.shoulderWidth / videoWidth) * 3.2 * modelScale
    let scaleY = (measurements.torsoLength / videoHeight) * 2.5 * modelScale
    let scaleZ = Math.min(scaleX, scaleY) * modelScale
    
    // Mobile-specific clothing adjustments
    const clothingType = getClothingTypeFromUrl(modelUrl)
    switch (clothingType) {
      case 'shirt':
        scaleY *= 0.7
        scaleX *= 1.1
        break
      case 'pants':
        scaleX = (measurements.hipWidth / videoWidth) * 2.8 * modelScale
        scaleY *= 1.3
        break
      case 'jacket':
        scaleX *= 1.2
        scaleY *= 0.8
        scaleZ *= 1.1
        break
    }
    
    // Apply confidence-based stability
    const stabilityFactor = Math.min(1, measurements.confidence * 1.5)
    scaleX = Math.max(0.3, Math.min(2.0, scaleX * stabilityFactor))
    scaleY = Math.max(0.3, Math.min(2.0, scaleY * stabilityFactor))
    scaleZ = Math.max(0.3, Math.min(1.5, scaleZ * stabilityFactor))
    
    model.scale.set(scaleX, scaleY, scaleZ)
    
    // Update tracking quality for UI
    setTrackingQuality(measurements.confidence)
  }, [modelUrl, modelScale, modelRotation, modelPosition])

  // Helper function to detect clothing type
  const getClothingTypeFromUrl = (url: string) => {
    const filename = url.toLowerCase()
    if (filename.includes('pants') || filename.includes('trouser') || filename.includes('baggy')) return 'pants'
    if (filename.includes('jacket') || filename.includes('blazer')) return 'jacket'
    if (filename.includes('dress')) return 'dress'
    return 'shirt'
  }

  // Mobile-optimized camera setup
  const setupMobileCamera = async () => {
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: 'user', // Force front camera
        width: deviceInfo.isIOS ? 
          { ideal: 1280, min: 640, max: 1920 } : 
          { ideal: 1920, min: 1280, max: 2560 },
        height: deviceInfo.isIOS ? 
          { ideal: 720, min: 480, max: 1080 } : 
          { ideal: 1080, min: 720, max: 1440 },
        frameRate: { ideal: 30, min: 24, max: 30 }
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    streamRef.current = stream
    
    const video = videoRef.current!
    video.srcObject = stream
    video.playsInline = true
    video.muted = true
    video.autoplay = true
    
    // iOS-specific attributes
    if (deviceInfo.isIOS) {
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
    }
    
    await video.play()
    
    // Wait for video metadata
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          resolve()
        } else {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    })
  }

  // Capture screenshot with mobile optimization
  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !rendererRef.current) return
    
    setIsCapturing(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      
      // Use higher resolution for mobile screenshots
      const scale = deviceInfo.isIOS ? 2 : 1.5
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      
      // Draw mirrored video
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight)
      ctx.restore()
      
      // Draw 3D overlay
      const overlayCanvas = renderer.domElement
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(overlayCanvas, -video.videoWidth, 0, video.videoWidth, video.videoHeight)
      ctx.restore()
      
      // Add mobile-specific overlay info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 250, 80)
      ctx.fillStyle = 'white'
      ctx.font = '16px Arial'
      ctx.fillText('ARWEAR Mobile Try-On', 15, 35)
      ctx.font = '12px Arial'
      ctx.fillText(`Quality: ${(trackingQuality * 100).toFixed(0)}%`, 15, 55)
      ctx.fillText(`Device: ${deviceInfo.isIOS ? 'iOS' : 'Android'} ${deviceInfo.browser}`, 15, 75)
      
      // Download with mobile-friendly filename
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `arwear-mobile-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Mobile screenshot failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [trackingQuality, deviceInfo])

  // Initialize mobile AR
  useEffect(() => {
    let mounted = true

    const initMobileAR = async () => {
      try {
        if (!deviceInfo.isIOS && !deviceInfo.isAndroid) {
          throw new Error('Mobile device required for optimal AR experience')
        }

        setStatus("Initializing TensorFlow for mobile...")
        
        // Mobile-optimized TensorFlow setup
        await tf.ready()
        try {
          if (deviceInfo.isIOS) {
            await tf.setBackend('cpu') // iOS sometimes has WebGL issues
          } else {
            await tf.setBackend('webgl')
          }
        } catch {
          await tf.setBackend('cpu')
        }

        setStatus("Setting up front camera...")
        await setupMobileCamera()
        
        if (!mounted) return

        setStatus("Loading 3D model...")
        
        // Three.js setup optimized for mobile
        const container = containerRef.current!
        const scene = new THREE.Scene()
        sceneRef.current = scene

        const aspect = container.clientWidth / container.clientHeight
        const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10)
        camera.position.set(0, 0, 5)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ 
          antialias: !deviceInfo.isAndroid, // Disable AA on Android for performance
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        })
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, deviceInfo.isIOS ? 2 : 1.5))
        renderer.setClearColor(0x000000, 0)
        rendererRef.current = renderer

        const overlay = container.querySelector('.ar-overlay') as HTMLElement
        overlay.appendChild(renderer.domElement)

        // Mobile-optimized lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
        directionalLight.position.set(1, 1, 1)
        scene.add(directionalLight)

        // Load and optimize 3D model for mobile
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(modelUrl)
        const model = gltf.scene
        
        model.traverse((child: any) => {
          if (child.isMesh) {
            // Mobile optimizations
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              child.material.transparent = true
              child.material.opacity = 0.95
              // Reduce texture quality on Android for performance
              if (deviceInfo.isAndroid && child.material.map) {
                child.material.map.generateMipmaps = false
              }
            }
          }
        })

        // Normalize model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        model.position.sub(center)
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
          model.scale.setScalar(0.8 / maxDim)
        }

        scene.add(model)
        modelRef.current = model

        setStatus("Starting pose detection...")

        // Mobile-optimized pose detector
        detectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.BlazePose,
          {
            runtime: 'tfjs',
            modelType: 'lite', // Use lite model for mobile performance
            enableSmoothing: true,
            enableSegmentation: false
          }
        )

        setStatus("Mobile AR ready!")
        setIsReady(true)
        onReadyChange?.(true)

        // Mobile-optimized animation loop
        let lastPoseDetection = 0
        const poseInterval = deviceInfo.isIOS ? 150 : 100 // Slower on iOS

        const animate = async () => {
          if (!mounted) return

          const video = videoRef.current
          const detector = detectorRef.current
          const model = modelRef.current

          if (video && detector && model && video.readyState >= 2) {
            try {
              const now = performance.now()
              if (now - lastPoseDetection >= poseInterval) {
                lastPoseDetection = now

                const poses = await detector.estimatePoses(video, {
                  flipHorizontal: true
                })

                if (poses.length > 0) {
                  const measurements = calculateMobileBodyFit(poses)
                  if (measurements && measurements.confidence > 0.5) {
                    applyMobileFit(measurements, video.videoWidth, video.videoHeight)
                  }
                }
              }
            } catch (error) {
              console.warn('Mobile pose detection error:', error)
            }
          }

          // Render
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }

          animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        // Mobile resize handler
        const handleResize = () => {
          const container = containerRef.current
          const renderer = rendererRef.current
          const camera = cameraRef.current
          
          if (container && renderer && camera) {
            const aspect = container.clientWidth / container.clientHeight
            camera.left = -aspect
            camera.right = aspect
            camera.updateProjectionMatrix()
            renderer.setSize(container.clientWidth, container.clientHeight)
          }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)

      } catch (error: any) {
        console.error('Mobile AR initialization failed:', error)
        setError(error.message || 'Mobile AR initialization failed')
        onReadyChange?.(false)
      }
    }

    if (deviceInfo.isIOS || deviceInfo.isAndroid) {
      initMobileAR()
    }

    return () => {
      mounted = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
      if (detectorRef.current) {
        detectorRef.current.dispose()
      }
    }
  }, [deviceInfo, modelUrl, onReadyChange, calculateMobileBodyFit, applyMobileFit])

  if (!deviceInfo.isIOS && !deviceInfo.isAndroid) {
    return (
      <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-orange-700">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Mobile Device Recommended</span>
        </div>
        <p className="text-orange-600 text-sm mt-1">
          For the best AR try-on experience, please use a mobile device with front camera.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Mobile AR Error</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <div ref={containerRef} className="relative w-full aspect-[3/4]">
        {/* Front camera video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
          autoPlay
        />
        
        {/* AR overlay */}
        <div 
          className="ar-overlay absolute inset-0"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Mobile controls overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {/* Quality indicator */}
          <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  trackingQuality > 0.8 ? 'bg-green-400' :
                  trackingQuality > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
              />
              <span>Quality: {(trackingQuality * 100).toFixed(0)}%</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              {deviceInfo.isIOS ? 'iOS' : 'Android'} {deviceInfo.browser}
            </div>
          </div>

          {/* Screenshot button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={captureScreenshot}
            disabled={!isReady || isCapturing}
            className="bg-white/90 hover:bg-white text-black"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile-friendly controls at bottom */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          {/* Scale and rotation controls */}
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModelScale(prev => Math.max(0.5, prev - 0.1))}
                className="text-white hover:bg-white/20 p-2"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm font-medium min-w-[60px] text-center">
                {(modelScale * 100).toFixed(0)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModelScale(prev => Math.min(2.0, prev + 0.1))}
                className="text-white hover:bg-white/20 p-2"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModelRotation(prev => prev - 15)}
                className="text-white hover:bg-white/20 p-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm font-medium min-w-[40px] text-center">
                {modelRotation}°
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModelRotation(prev => prev + 15)}
                className="text-white hover:bg-white/20 p-2"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </Button>
            </div>
          </div>

          {/* Position controls */}
          <div className="flex justify-center">
            <div className="bg-black/70 rounded-full p-2">
              <div className="grid grid-cols-3 gap-1 w-32 h-32">
                <div></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelPosition(prev => ({ ...prev, y: prev.y + 5 }))}
                  className="text-white hover:bg-white/20 p-1"
                >
                  ↑
                </Button>
                <div></div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelPosition(prev => ({ ...prev, x: prev.x - 5 }))}
                  className="text-white hover:bg-white/20 p-1"
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelPosition({ x: 0, y: 0 })}
                  className="text-white hover:bg-white/20 p-1 text-xs"
                >
                  <Move className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelPosition(prev => ({ ...prev, x: prev.x + 5 }))}
                  className="text-white hover:bg-white/20 p-1"
                >
                  →
                </Button>
                
                <div></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelPosition(prev => ({ ...prev, y: prev.y - 5 }))}
                  className="text-white hover:bg-white/20 p-1"
                >
                  ↓
                </Button>
                <div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        {!isReady && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">{status}</p>
              <p className="text-sm text-gray-300 mt-2">
                Setting up mobile AR experience...
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for screenshots */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Mobile instructions */}
      {isReady && (
        <div className="p-4 bg-gray-900 text-white">
          <h4 className="font-medium mb-2">📱 Mobile AR Instructions:</h4>
          <ul className="text-sm space-y-1 text-gray-300">
            <li>• Hold your phone vertically for best results</li>
            <li>• Position yourself in good lighting</li>
            <li>• Keep your torso centered in the camera view</li>
            <li>• Use the controls below to adjust fit and position</li>
          </ul>
        </div>
      )}
    </div>
  )
}