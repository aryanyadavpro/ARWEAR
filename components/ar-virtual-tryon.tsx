"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as posedetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"
import { Button } from "./ui/button"
import { Camera, RotateCcw, Download } from "lucide-react"

type Props = {
  modelUrl: string
  onReadyChange?: (ready: boolean) => void
  className?: string
}

type ClothingType = 'shirt' | 'jacket' | 'pants' | 'dress' | 'accessory'
type BodyPart = 'torso' | 'legs' | 'full'

interface BodyMeasurements {
  shoulderWidth: number
  torsoLength: number
  hipWidth: number
  centerX: number
  centerY: number
  angle: number
  confidence: number
}

// Determine clothing type from model URL
function getClothingType(modelUrl: string): ClothingType {
  const filename = modelUrl.toLowerCase()
  if (filename.includes('jacket') || filename.includes('blazer')) return 'jacket'
  if (filename.includes('pants') || filename.includes('trouser') || filename.includes('jeans') || filename.includes('baggy')) return 'pants'
  if (filename.includes('dress') || filename.includes('gown')) return 'dress'
  if (filename.includes('shirt') || filename.includes('tee') || filename.includes('t-shirt')) return 'shirt'
  return 'shirt'
}

// Get target body part for clothing
function getTargetBodyPart(clothingType: ClothingType): BodyPart {
  switch (clothingType) {
    case 'pants': return 'legs'
    case 'dress': return 'full'
    default: return 'torso'
  }
}

export default function ARVirtualTryon({ modelUrl, onReadyChange, className = "" }: Props) {
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
  const [status, setStatus] = useState("Initializing AR...")
  const [isCapturing, setIsCapturing] = useState(false)

  // Enhanced body measurements calculation
  const calculateBodyMeasurements = useCallback((poses: any[]): BodyMeasurements | null => {
    if (!poses[0] || !poses[0].keypoints) return null
    
    const keypoints = poses[0].keypoints
    const clothingType = getClothingType(modelUrl)
    const bodyPart = getTargetBodyPart(clothingType)
    
    // Find required keypoints
    const leftShoulder = keypoints.find((kp: any) => kp.name === "left_shoulder")
    const rightShoulder = keypoints.find((kp: any) => kp.name === "right_shoulder")
    const leftHip = keypoints.find((kp: any) => kp.name === "left_hip")
    const rightHip = keypoints.find((kp: any) => kp.name === "right_hip")
    const leftKnee = keypoints.find((kp: any) => kp.name === "left_knee")
    const rightKnee = keypoints.find((kp: any) => kp.name === "right_knee")
    const nose = keypoints.find((kp: any) => kp.name === "nose")
    
    // Validate minimum required points based on clothing type
    let confidence = 0
    let centerX = 0, centerY = 0, shoulderWidth = 0, torsoLength = 0, hipWidth = 0, angle = 0
    
    if (bodyPart === 'legs' || bodyPart === 'full') {
      // For pants/dresses, focus on hip area
      if (!leftHip || !rightHip || leftHip.score < 0.4 || rightHip.score < 0.4) {
        return null
      }
      
      centerX = (leftHip.x + rightHip.x) / 2
      centerY = (leftHip.y + rightHip.y) / 2
      hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
      
      // Use shoulders for upper body measurements if available
      if (leftShoulder && rightShoulder && leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
        shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
        torsoLength = Math.hypot(
          centerX - (leftShoulder.x + rightShoulder.x) / 2,
          centerY - (leftShoulder.y + rightShoulder.y) / 2
        )
        angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x)
      } else {
        shoulderWidth = hipWidth * 1.2
        torsoLength = hipWidth * 1.5
        angle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x)
      }
      
      confidence = Math.min(leftHip.score!, rightHip.score!)
      
      // For full dresses, center between shoulders and hips
      if (bodyPart === 'full' && leftShoulder && rightShoulder) {
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
        centerX = (centerX + shoulderCenterX) / 2
        centerY = (centerY + shoulderCenterY) / 2
      }
    } else {
      // For torso clothing (shirts, jackets)
      if (!leftShoulder || !rightShoulder || leftShoulder.score < 0.4 || rightShoulder.score < 0.4) {
        return null
      }
      
      centerX = (leftShoulder.x + rightShoulder.x) / 2
      centerY = (leftShoulder.y + rightShoulder.y) / 2
      shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
      angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x)
      
      // Calculate torso length using hips if available
      if (leftHip && rightHip && leftHip.score > 0.3 && rightHip.score > 0.3) {
        const hipCenterY = (leftHip.y + rightHip.y) / 2
        torsoLength = Math.abs(hipCenterY - centerY)
        hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
      } else {
        torsoLength = shoulderWidth * 1.4 // fallback estimate
        hipWidth = shoulderWidth * 0.9
      }
      
      confidence = Math.min(leftShoulder.score!, rightShoulder.score!)
    }
    
    return {
      shoulderWidth,
      torsoLength,
      hipWidth,
      centerX,
      centerY,
      angle,
      confidence
    }
  }, [modelUrl])

  // Apply measurements to 3D model
  const applyClothingFit = useCallback((measurements: BodyMeasurements, videoWidth: number, videoHeight: number) => {
    const model = modelRef.current
    const renderer = rendererRef.current
    if (!model || !renderer) return

    const clothingType = getClothingType(modelUrl)
    const aspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight)

    // Convert to normalized device coordinates
    const ndcX = (measurements.centerX / videoWidth) * 2 - 1
    const ndcY = -(measurements.centerY / videoHeight) * 2 + 1

    // Position in world coordinates
    const worldX = ndcX * aspect
    const worldY = ndcY
    
    // Adjust position based on clothing type
    let positionOffsetY = 0
    switch (clothingType) {
      case 'pants':
        positionOffsetY = -0.15 // Position lower for pants
        break
      case 'jacket':
        positionOffsetY = 0.05 // Position slightly higher for jackets
        break
      case 'dress':
        positionOffsetY = -0.05 // Center for dresses
        break
    }

    model.position.set(worldX, worldY + positionOffsetY, 0)
    model.rotation.set(0, 0, measurements.angle)

    // Calculate scale based on body measurements and clothing type
    let scaleX = (measurements.shoulderWidth / videoWidth) * 3.2
    let scaleY = (measurements.torsoLength / videoHeight) * 2.8
    let scaleZ = Math.min(scaleX, scaleY)

    // Clothing-specific scale adjustments
    switch (clothingType) {
      case 'shirt':
        scaleY *= 0.75 // Shirts are shorter
        scaleX *= 1.1  // Slightly wider for comfort
        break
      case 'jacket':
        scaleY *= 0.85 // Jackets are longer than shirts
        scaleX *= 1.2  // Wider for layering
        scaleZ *= 1.1  // Thicker
        break
      case 'pants':
        scaleX = (measurements.hipWidth / videoWidth) * 2.8 // Use hip width for pants
        scaleY *= 1.4  // Pants are longer
        scaleZ *= 0.8  // Thinner profile
        break
      case 'dress':
        scaleY *= 1.3  // Dresses are longer
        scaleX *= 1.05 // Slightly fitted
        break
    }

    // Apply confidence-based smoothing and bounds
    const confidenceFactor = Math.min(1, measurements.confidence * 2)
    scaleX = Math.max(0.4, Math.min(2.2, scaleX * confidenceFactor))
    scaleY = Math.max(0.4, Math.min(2.5, scaleY * confidenceFactor))
    scaleZ = Math.max(0.4, Math.min(1.8, scaleZ * confidenceFactor))

    model.scale.set(scaleX, scaleY, scaleZ)
  }, [modelUrl])

  // Capture screenshot
  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !rendererRef.current) return
    
    setIsCapturing(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      
      // Set canvas size to video size
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')!
      
      // Draw video frame
      ctx.save()
      ctx.scale(-1, 1) // Mirror the image
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()
      
      // Draw 3D overlay
      const overlayCanvas = renderer.domElement
      ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)
      
      // Download the image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `ar-tryon-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [])

  // Initialize AR try-on
  useEffect(() => {
    let mounted = true

    const initAR = async () => {
      try {
        setStatus("Initializing TensorFlow...")
        
        // Initialize TensorFlow.js
        await tf.ready()
        try {
          await tf.setBackend('webgl')
        } catch {
          await tf.setBackend('cpu')
        }

        setStatus("Requesting camera access...")
        
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30 }
          }
        })
        
        if (!mounted) return
        streamRef.current = stream

        const video = videoRef.current!
        video.srcObject = stream
        video.play()

        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            resolve()
          }
          video.addEventListener('loadedmetadata', onLoadedMetadata)
        })

        setStatus("Loading 3D model...")

        // Setup Three.js
        const container = containerRef.current!
        const scene = new THREE.Scene()
        sceneRef.current = scene

        const aspect = container.clientWidth / container.clientHeight
        const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10)
        camera.position.set(0, 0, 5)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          preserveDrawingBuffer: true
        })
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        rendererRef.current = renderer

        const overlay = container.querySelector('.ar-overlay') as HTMLElement
        overlay.appendChild(renderer.domElement)

        // Lighting setup
        scene.add(new THREE.AmbientLight(0xffffff, 0.8))
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
        directionalLight.position.set(2, 2, 2)
        scene.add(directionalLight)

        // Load 3D model
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(modelUrl)
        const model = gltf.scene
        
        // Optimize model
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              child.material.transparent = true
              child.material.opacity = 0.95
            }
          }
        })

        // Normalize and center model
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

        setStatus("Loading pose detection...")

        // Initialize pose detector
        detectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.BlazePose,
          {
            runtime: 'tfjs',
            modelType: 'lite',
            enableSmoothing: true,
            enableSegmentation: false
          }
        )

        setStatus("Ready for AR try-on!")
        setIsReady(true)
        onReadyChange?.(true)

        // Animation loop
        const animate = async () => {
          if (!mounted) return

          const video = videoRef.current
          const detector = detectorRef.current
          const model = modelRef.current

          if (video && detector && model && video.readyState >= 2) {
            try {
              // Detect poses at reduced resolution for performance
              const poses = await detector.estimatePoses(video, {
                flipHorizontal: true
              })

              if (poses.length > 0) {
                const measurements = calculateBodyMeasurements(poses)
                if (measurements && measurements.confidence > 0.4) {
                  applyClothingFit(measurements, video.videoWidth, video.videoHeight)
                }
              }
            } catch (error) {
              console.warn('Pose detection error:', error)
            }
          }

          // Render
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }

          animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        // Handle resize
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

        return () => {
          window.removeEventListener('resize', handleResize)
        }

      } catch (error: any) {
        console.error('AR initialization failed:', error)
        setError(error.message || 'AR try-on initialization failed')
        onReadyChange?.(false)
      }
    }

    initAR()

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
  }, [modelUrl, onReadyChange, calculateBodyMeasurements, applyClothingFit])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <Camera className="w-5 h-5" />
          <span className="font-medium">AR Try-on Error</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <div ref={containerRef} className="relative w-full aspect-video">
        {/* Camera video */}
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

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
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

        {/* Status indicator */}
        {!isReady && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-2 rounded">
            {status}
          </div>
        )}
      </div>
      
      {/* Hidden canvas for screenshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}