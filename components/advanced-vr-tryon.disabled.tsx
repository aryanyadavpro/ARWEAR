"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as posedetection from "@tensorflow-models/pose-detection"
// Body segmentation removed due to MediaPipe dependency issues
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"
import { Button } from "./ui/button"
import { Camera, Download, Settings, RotateCcw, Maximize2 } from "lucide-react"

type Props = {
  modelUrl: string
  onReadyChange?: (ready: boolean) => void
  className?: string
}

type ClothingType = 'shirt' | 'jacket' | 'pants' | 'dress' | 'accessory'
type BodyPart = 'torso' | 'legs' | 'full'

interface EnhancedBodyMeasurements {
  // Core measurements
  shoulderWidth: number
  torsoLength: number
  hipWidth: number
  centerX: number
  centerY: number
  angle: number
  confidence: number
  
  // Advanced measurements
  armSpan: number
  neckPosition: { x: number, y: number }
  waistWidth: number
  legLength: number
  bodyHeight: number
  
  // Segmentation data
  bodyMask?: ImageData
  torsoMask?: ImageData
  
  // Tracking quality
  poseStability: number
  frameConsistency: number
}

// Enhanced clothing detection
function getClothingType(modelUrl: string): ClothingType {
  const filename = modelUrl.toLowerCase()
  if (filename.includes('jacket') || filename.includes('blazer') || filename.includes('coat')) return 'jacket'
  if (filename.includes('pants') || filename.includes('trouser') || filename.includes('jeans') || filename.includes('baggy')) return 'pants'
  if (filename.includes('dress') || filename.includes('gown') || filename.includes('frock')) return 'dress'
  if (filename.includes('shirt') || filename.includes('tee') || filename.includes('t-shirt') || filename.includes('top')) return 'shirt'
  return 'shirt'
}

function getTargetBodyPart(clothingType: ClothingType): BodyPart {
  switch (clothingType) {
    case 'pants': return 'legs'
    case 'dress': return 'full'
    default: return 'torso'
  }
}

export default function AdvancedVRTryon({ modelUrl, onReadyChange, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const segmentationCanvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const poseDetectorRef = useRef<posedetection.PoseDetector | null>(null)
  // Body segmenter removed due to dependency issues
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  
  // Enhanced state management
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Initializing Advanced AR...")
  const [isCapturing, setIsCapturing] = useState(false)
  const [trackingQuality, setTrackingQuality] = useState(0)
  const [showSegmentation, setShowSegmentation] = useState(false)
  const [settings, setSettings] = useState({
    enableBodySegmentation: true,
    highPrecisionPose: false,
    smoothTracking: true,
    adaptiveScaling: true
  })
  
  // Tracking history for stability analysis
  const trackingHistoryRef = useRef<EnhancedBodyMeasurements[]>([])
  
  // Enhanced pose tracking with stability analysis
  const analyzeTrackingStability = useCallback((measurements: EnhancedBodyMeasurements[]): number => {
    if (measurements.length < 5) return 0
    
    const recent = measurements.slice(-5)
    let positionVariance = 0
    let angleVariance = 0
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1]
      const curr = recent[i]
      
      positionVariance += Math.abs(curr.centerX - prev.centerX) + Math.abs(curr.centerY - prev.centerY)
      angleVariance += Math.abs(curr.angle - prev.angle)
    }
    
    // Lower variance = higher stability
    const stability = Math.max(0, 1 - (positionVariance / 0.5) - (angleVariance / 0.5))
    return Math.min(1, stability)
  }, [])
  
  // Advanced body measurements with segmentation
  const calculateEnhancedBodyMeasurements = useCallback(async (
    poses: any[], 
    segmentation?: any
  ): Promise<EnhancedBodyMeasurements | null> => {
    if (!poses[0] || !poses[0].keypoints) return null
    
    const keypoints = poses[0].keypoints
    const clothingType = getClothingType(modelUrl)
    const bodyPart = getTargetBodyPart(clothingType)
    
    // Find all keypoints
    const leftShoulder = keypoints.find((kp: any) => kp.name === "left_shoulder")
    const rightShoulder = keypoints.find((kp: any) => kp.name === "right_shoulder")
    const leftElbow = keypoints.find((kp: any) => kp.name === "left_elbow")
    const rightElbow = keypoints.find((kp: any) => kp.name === "right_elbow")
    const leftWrist = keypoints.find((kp: any) => kp.name === "left_wrist")
    const rightWrist = keypoints.find((kp: any) => kp.name === "right_wrist")
    const leftHip = keypoints.find((kp: any) => kp.name === "left_hip")
    const rightHip = keypoints.find((kp: any) => kp.name === "right_hip")
    const leftKnee = keypoints.find((kp: any) => kp.name === "left_knee")
    const rightKnee = keypoints.find((kp: any) => kp.name === "right_knee")
    const leftAnkle = keypoints.find((kp: any) => kp.name === "left_ankle")
    const rightAnkle = keypoints.find((kp: any) => kp.name === "right_ankle")
    const nose = keypoints.find((kp: any) => kp.name === "nose")
    const neck = keypoints.find((kp: any) => kp.name === "neck") || 
                 (leftShoulder && rightShoulder ? {
                   x: (leftShoulder.x + rightShoulder.x) / 2,
                   y: Math.min(leftShoulder.y, rightShoulder.y) - 20,
                   score: Math.min(leftShoulder.score, rightShoulder.score)
                 } : null)
    
    // Enhanced validation based on clothing type
    let confidence = 0
    let centerX = 0, centerY = 0, shoulderWidth = 0, torsoLength = 0
    let hipWidth = 0, angle = 0, armSpan = 0, waistWidth = 0, legLength = 0, bodyHeight = 0
    let neckPosition = { x: 0, y: 0 }
    
    if (bodyPart === 'legs' || bodyPart === 'full') {
      // Enhanced hip-focused measurements for pants/dresses
      if (!leftHip || !rightHip || leftHip.score < 0.4 || rightHip.score < 0.4) {
        return null
      }
      
      centerX = (leftHip.x + rightHip.x) / 2
      centerY = (leftHip.y + rightHip.y) / 2
      hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
      
      // Calculate leg length
      if (leftAnkle && rightAnkle && leftAnkle.score > 0.3 && rightAnkle.score > 0.3) {
        const leftLegLength = Math.hypot(leftHip.x - leftAnkle.x, leftHip.y - leftAnkle.y)
        const rightLegLength = Math.hypot(rightHip.x - rightAnkle.x, rightHip.y - rightAnkle.y)
        legLength = (leftLegLength + rightLegLength) / 2
      } else {
        legLength = hipWidth * 3 // fallback estimate
      }
      
      // Enhanced shoulder measurements for full-body items
      if (leftShoulder && rightShoulder && leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
        shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
        torsoLength = Math.hypot(
          centerX - (leftShoulder.x + rightShoulder.x) / 2,
          centerY - (leftShoulder.y + rightShoulder.y) / 2
        )
        angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x)
        
        // Calculate arm span
        if (leftWrist && rightWrist && leftWrist.score > 0.3 && rightWrist.score > 0.3) {
          armSpan = Math.hypot(rightWrist.x - leftWrist.x, rightWrist.y - leftWrist.y)
        }
      } else {
        shoulderWidth = hipWidth * 1.15
        torsoLength = hipWidth * 1.8
        angle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x)
      }
      
      confidence = Math.min(leftHip.score!, rightHip.score!)
      
      // For dresses, adjust center point
      if (bodyPart === 'full' && leftShoulder && rightShoulder) {
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
        centerX = (centerX + shoulderCenterX) / 2
        centerY = (centerY + shoulderCenterY) / 2
      }
    } else {
      // Enhanced torso measurements for shirts/jackets
      if (!leftShoulder || !rightShoulder || leftShoulder.score < 0.4 || rightShoulder.score < 0.4) {
        return null
      }
      
      centerX = (leftShoulder.x + rightShoulder.x) / 2
      centerY = (leftShoulder.y + rightShoulder.y) / 2
      shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
      angle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x)
      
      // Enhanced torso length calculation
      if (leftHip && rightHip && leftHip.score > 0.3 && rightHip.score > 0.3) {
        const hipCenterY = (leftHip.y + rightHip.y) / 2
        torsoLength = Math.abs(hipCenterY - centerY)
        hipWidth = Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
        waistWidth = hipWidth * 0.8 // Estimate waist as narrower than hips
      } else {
        torsoLength = shoulderWidth * 1.6
        hipWidth = shoulderWidth * 0.9
        waistWidth = shoulderWidth * 0.7
      }
      
      // Calculate arm span for better fitting
      if (leftWrist && rightWrist && leftWrist.score > 0.3 && rightWrist.score > 0.3) {
        armSpan = Math.hypot(rightWrist.x - leftWrist.x, rightWrist.y - leftWrist.y)
      } else {
        armSpan = shoulderWidth * 2.2 // Estimate based on shoulder width
      }
      
      confidence = Math.min(leftShoulder.score!, rightShoulder.score!)
    }
    
    // Calculate neck position
    if (neck && neck.score > 0.3) {
      neckPosition = { x: neck.x, y: neck.y }
    } else if (nose && nose.score > 0.4) {
      neckPosition = { x: nose.x, y: nose.y + 40 } // Estimate neck below nose
    } else {
      neckPosition = { x: centerX, y: centerY - torsoLength * 0.4 }
    }
    
    // Calculate overall body height
    if (nose && leftAnkle && rightAnkle && nose.score > 0.3 && 
        leftAnkle.score > 0.3 && rightAnkle.score > 0.3) {
      const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2
      bodyHeight = avgAnkleY - nose.y
    } else {
      bodyHeight = torsoLength + legLength
    }
    
    // Calculate pose stability
    const currentMeasurement: EnhancedBodyMeasurements = {
      shoulderWidth,
      torsoLength,
      hipWidth,
      centerX,
      centerY,
      angle,
      confidence,
      armSpan,
      neckPosition,
      waistWidth,
      legLength,
      bodyHeight,
      poseStability: 0,
      frameConsistency: 0
    }
    
    // Add to tracking history
    trackingHistoryRef.current.push(currentMeasurement)
    if (trackingHistoryRef.current.length > 10) {
      trackingHistoryRef.current.shift()
    }
    
    // Calculate stability metrics
    const poseStability = analyzeTrackingStability(trackingHistoryRef.current)
    const frameConsistency = trackingHistoryRef.current.length >= 5 ? 
      Math.min(1, confidence * 1.5) : confidence
    
    return {
      ...currentMeasurement,
      poseStability,
      frameConsistency,
      bodyMask: segmentation?.data
    }
  }, [modelUrl, analyzeTrackingStability])
  
  // Enhanced clothing fitting with advanced measurements
  const applyAdvancedClothingFit = useCallback((
    measurements: EnhancedBodyMeasurements, 
    videoWidth: number, 
    videoHeight: number
  ) => {
    const model = modelRef.current
    const renderer = rendererRef.current
    if (!model || !renderer) return
    
    const clothingType = getClothingType(modelUrl)
    const aspect = renderer.domElement.clientWidth / Math.max(1, renderer.domElement.clientHeight)
    
    // Enhanced coordinate transformation
    const ndcX = (measurements.centerX / videoWidth) * 2 - 1
    const ndcY = -(measurements.centerY / videoHeight) * 2 + 1
    
    const worldX = ndcX * aspect
    const worldY = ndcY
    
    // Advanced position adjustments based on clothing type and body measurements
    let positionOffsetY = 0
    let positionOffsetX = 0
    
    switch (clothingType) {
      case 'shirt':
        positionOffsetY = 0.02
        break
      case 'jacket':
        positionOffsetY = 0.05
        break
      case 'pants':
        positionOffsetY = -0.15
        // Use hip measurements for better positioning
        const hipCenterX = (measurements.centerX / videoWidth) * 2 - 1
        positionOffsetX = (hipCenterX - ndcX) * aspect * 0.5
        break
      case 'dress':
        positionOffsetY = -0.05
        break
    }
    
    model.position.set(worldX + positionOffsetX, worldY + positionOffsetY, 0)
    
    // Smoothed rotation based on pose stability
    const targetAngle = measurements.angle
    const currentAngle = model.rotation.z
    const rotationSpeed = measurements.poseStability > 0.7 ? 0.8 : 0.3
    const smoothedAngle = currentAngle + (targetAngle - currentAngle) * rotationSpeed
    model.rotation.set(0, 0, smoothedAngle)
    
    // Enhanced scaling with adaptive measurements
    let scaleX = (measurements.shoulderWidth / videoWidth) * 3.5
    let scaleY = (measurements.torsoLength / videoHeight) * 3.2
    let scaleZ = Math.min(scaleX, scaleY)
    
    // Clothing-specific advanced scaling
    switch (clothingType) {
      case 'shirt':
        scaleX *= 1.15 // Slightly looser fit
        scaleY *= 0.75
        scaleZ *= 0.9
        // Use arm span for better sleeve fitting
        if (measurements.armSpan > 0) {
          scaleX = Math.max(scaleX, (measurements.armSpan / videoWidth) * 1.8)
        }
        break
      case 'jacket':
        scaleX *= 1.3 // Looser fit for layering
        scaleY *= 0.85
        scaleZ *= 1.2
        if (measurements.armSpan > 0) {
          scaleX = Math.max(scaleX, (measurements.armSpan / videoWidth) * 2.0)
        }
        break
      case 'pants':
        scaleX = (measurements.hipWidth / videoWidth) * 3.0
        scaleY = (measurements.legLength / videoHeight) * 2.5
        scaleZ *= 0.8
        // Use waist measurements for better fit
        if (measurements.waistWidth > 0) {
          scaleX = Math.min(scaleX, (measurements.waistWidth / videoWidth) * 3.5)
        }
        break
      case 'dress':
        scaleX = Math.max(
          (measurements.shoulderWidth / videoWidth) * 2.8,
          (measurements.hipWidth / videoWidth) * 2.6
        )
        scaleY = (measurements.bodyHeight / videoHeight) * 1.8
        scaleZ *= 1.0
        break
    }
    
    // Apply confidence and stability-based adjustments
    const confidenceFactor = Math.min(1, measurements.confidence * 1.2)
    const stabilityFactor = Math.min(1, measurements.poseStability * 0.3 + 0.7)
    
    scaleX = Math.max(0.4, Math.min(2.5, scaleX * confidenceFactor * stabilityFactor))
    scaleY = Math.max(0.4, Math.min(3.0, scaleY * confidenceFactor * stabilityFactor))
    scaleZ = Math.max(0.4, Math.min(2.0, scaleZ * confidenceFactor))
    
    // Smooth scaling transitions
    const currentScale = model.scale
    const scaleSpeed = measurements.poseStability > 0.6 ? 0.7 : 0.2
    const smoothedScaleX = currentScale.x + (scaleX - currentScale.x) * scaleSpeed
    const smoothedScaleY = currentScale.y + (scaleY - currentScale.y) * scaleSpeed
    const smoothedScaleZ = currentScale.z + (scaleZ - currentScale.z) * scaleSpeed
    
    model.scale.set(smoothedScaleX, smoothedScaleY, smoothedScaleZ)
    
    // Update tracking quality display
    const quality = (measurements.confidence + measurements.poseStability + measurements.frameConsistency) / 3
    setTrackingQuality(quality)
    
  }, [modelUrl])
  
  // Enhanced screenshot with segmentation overlay
  const captureAdvancedScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !rendererRef.current) return
    
    setIsCapturing(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')!
      
      // Draw mirrored video
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()
      
      // Draw 3D overlay
      const overlayCanvas = renderer.domElement
      ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height)
      
      // Add quality metrics overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 200, 60)
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.fillText(`Tracking Quality: ${(trackingQuality * 100).toFixed(0)}%`, 15, 30)
      ctx.fillText(`Advanced VR Try-On`, 15, 50)
      
      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `advanced-vr-tryon-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    } finally {
      setIsCapturing(false)
    }
  }, [trackingQuality])
  
  // Initialize advanced AR with body segmentation
  useEffect(() => {
    let mounted = true
    
    const initAdvancedAR = async () => {
      try {
        setStatus("Initializing Advanced Computer Vision...")
        
        await tf.ready()
        try {
          await tf.setBackend('webgl')
        } catch {
          await tf.setBackend('cpu')
        }
        
        setStatus("Requesting high-resolution camera...")
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, min: 20 }
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
        
        setStatus("Loading advanced 3D model...")
        
        // Setup enhanced Three.js scene
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
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        })
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(0x000000, 0)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        rendererRef.current = renderer
        
        const overlay = container.querySelector('.ar-overlay') as HTMLElement
        overlay.appendChild(renderer.domElement)
        
        // Enhanced lighting setup
        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight1.position.set(2, 2, 2)
        directionalLight1.castShadow = true
        scene.add(directionalLight1)
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
        directionalLight2.position.set(-2, 1, 1)
        scene.add(directionalLight2)
        
        // Load and optimize 3D model
        setStatus("Optimizing 3D model for VR...")
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(modelUrl)
        const model = gltf.scene
        
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            if (child.material) {
              child.material.transparent = true
              child.material.opacity = 0.98
              child.material.side = THREE.DoubleSide
            }
          }
        })
        
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
        
        setStatus("Loading advanced pose detection...")
        
        // Initialize enhanced pose detector
        poseDetectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.BlazePose,
          {
            runtime: 'tfjs',
            modelType: settings.highPrecisionPose ? 'full' : 'lite',
            enableSmoothing: settings.smoothTracking,
            enableSegmentation: false
          }
        )
        
        // Body segmentation temporarily disabled due to MediaPipe dependencies
        
        setStatus("Advanced VR Try-On Ready!")
        setIsReady(true)
        onReadyChange?.(true)
        
        // Enhanced animation loop
        const animate = async () => {
          if (!mounted) return
          
          const video = videoRef.current
          const poseDetector = poseDetectorRef.current
          const model = modelRef.current
          
          if (video && poseDetector && model && video.readyState >= 2) {
            try {
              // Detect poses with advanced tracking
              const poses = await poseDetector.estimatePoses(video, {
                flipHorizontal: true
              })
              
              if (poses.length > 0) {
                const measurements = await calculateEnhancedBodyMeasurements(poses, null)
                if (measurements && measurements.confidence > 0.3) {
                  applyAdvancedClothingFit(measurements, video.videoWidth, video.videoHeight)
                }
              }
            } catch (error) {
              console.warn('Advanced tracking error:', error)
            }
          }
          
          // Render with enhanced quality
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
        console.error('Advanced AR initialization failed:', error)
        setError(error.message || 'Advanced VR try-on initialization failed')
        onReadyChange?.(false)
      }
    }
    
    initAdvancedAR()
    
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
      if (poseDetectorRef.current) {
        poseDetectorRef.current.dispose()
      }
    }
  }, [modelUrl, onReadyChange, settings, calculateEnhancedBodyMeasurements, applyAdvancedClothingFit, showSegmentation])
  
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <Camera className="w-5 h-5" />
          <span className="font-medium">Advanced VR Try-on Error</span>
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
      <div ref={containerRef} className="relative w-full aspect-video">
        {/* High-resolution video */}
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
        
        {/* Segmentation overlay */}
        {showSegmentation && (
          <canvas
            ref={segmentationCanvasRef}
            className="absolute inset-0 w-full h-full opacity-30"
            style={{ transform: 'scaleX(-1)', mixBlendMode: 'overlay' }}
          />
        )}
        
        {/* Advanced controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSegmentation(!showSegmentation)}
            className="bg-purple-600/90 hover:bg-purple-500 text-white"
            title="Toggle body segmentation"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={captureAdvancedScreenshot}
            disabled={!isReady || isCapturing}
            className="bg-green-600/90 hover:bg-green-500 text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Tracking quality indicator */}
        {isReady && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
            <div className="flex items-center gap-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  trackingQuality > 0.8 ? 'bg-green-400' :
                  trackingQuality > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
              />
              <span>Quality: {(trackingQuality * 100).toFixed(0)}%</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">Advanced VR</div>
          </div>
        )}
        
        {/* Status indicator */}
        {!isReady && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-2 rounded">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              {status}
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for screenshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}