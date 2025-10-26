"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { Button } from "./ui/button"
import { Camera, X, ZoomIn, ZoomOut, RotateCcw, Download, Scan } from "lucide-react"

interface AdvancedCameraTryonProps {
  modelUrl: string
  className?: string
}

export default function AdvancedCameraTryon({ modelUrl, className = "" }: AdvancedCameraTryonProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const animationRef = useRef<number | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const lastVideoTimeRef = useRef(-1)
  
  // Smoothing filter for pose tracking
  const poseHistoryRef = useRef<Array<{x: number, y: number, scale: number}>>([]) 
  const smoothingFactor = 0.3
  
  // Model dimensions for adaptive scaling
  const modelDimensionsRef = useRef({ width: 1, height: 1, depth: 1 })

  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [poseTracking, setPoseTracking] = useState(true)
  const [poseDetected, setPoseDetected] = useState(false)
  
  // Model transform controls
  const [modelScale, setModelScale] = useState(0.5)
  const [modelRotation, setModelRotation] = useState(0)
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0.1 })
  
  // Pose-based automatic positioning
  const [autoPose, setAutoPose] = useState({ x: 0, y: 0.1, scale: 1.0, shoulderWidth: 0 })

  // Load 3D model
  useEffect(() => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    const setupRenderer = () => {
      const videoWidth = video.videoWidth || 1280
      const videoHeight = video.videoHeight || 720
      
      canvas.width = videoWidth
      canvas.height = videoHeight
      
      const scene = new THREE.Scene()
      const aspect = videoWidth / Math.max(1, videoHeight)
      const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000)
      camera.position.z = 5

      const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      })
      renderer.setSize(videoWidth, videoHeight)
      renderer.setClearColor(0x000000, 0)

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
      scene.add(ambientLight)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
      directionalLight.position.set(2, 2, 5)
      scene.add(directionalLight)

      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer

      // Load GLB model
      const loader = new GLTFLoader()
      setLoading(true)
      
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene
          
          // Center and scale model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          
          // Store original model dimensions for intelligent scaling
          modelDimensionsRef.current = {
            width: size.x,
            height: size.y,
            depth: size.z
          }
          
          // Normalize model to unit scale
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 0.3 / maxDim
          
          model.position.sub(center)
          model.scale.setScalar(scale)
          
          scene.add(model)
          modelRef.current = model
          setModelLoaded(true)
          setLoading(false)
          console.log('Model dimensions:', modelDimensionsRef.current)
        },
        undefined,
        (err) => {
          console.error("Error loading model:", err)
          setError("Failed to load 3D model")
          setLoading(false)
        }
      )
    }
    
    if (video.readyState >= 2) {
      setupRenderer()
    } else {
      video.addEventListener('loadedmetadata', setupRenderer)
    }

    return () => {
      video.removeEventListener('loadedmetadata', setupRenderer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [cameraActive, modelUrl])

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    if (!cameraActive) return

    const initPoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        )
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        })
        poseLandmarkerRef.current = poseLandmarker
        console.log("Pose landmarker initialized")
      } catch (err) {
        console.error("Failed to initialize pose landmarker:", err)
        setPoseTracking(false)
      }
    }

    initPoseLandmarker()

    return () => {
      poseLandmarkerRef.current?.close()
    }
  }, [cameraActive])

  // Animation loop with pose detection
  useEffect(() => {
    if (!cameraActive || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !videoRef.current) return

      // Detect pose if tracking is enabled
      if (poseTracking && poseLandmarkerRef.current && modelLoaded) {
        const video = videoRef.current
        const currentTime = video.currentTime
        
        if (currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentTime
          
          try {
            const results = poseLandmarkerRef.current.detectForVideo(video, performance.now())
            
            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0]
              setPoseDetected(true)
              
              // Get shoulder landmarks (11: left shoulder, 12: right shoulder)
              const leftShoulder = landmarks[11]
              const rightShoulder = landmarks[12]
              
              if (leftShoulder && rightShoulder) {
                // Get additional body landmarks for comprehensive tracking
                const leftHip = landmarks[23]
                const rightHip = landmarks[24]
                const nose = landmarks[0]
                
                // Calculate shoulder measurements
                const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
                const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
                const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
                
                // Calculate torso length and hip width
                let torsoLength = 0
                let hipWidth = 0
                
                if (leftHip && rightHip) {
                  const hipCenterY = (leftHip.y + rightHip.y) / 2
                  torsoLength = Math.abs(hipCenterY - shoulderCenterY)
                  hipWidth = Math.abs(rightHip.x - leftHip.x)
                }
                
                // Advanced multi-factor scale calculation
                const referenceShoulderWidth = 0.18
                const referenceTorsoLength = 0.30
                const referenceHipWidth = 0.16
                
                // Calculate individual scale factors
                const shoulderScale = shoulderWidth / referenceShoulderWidth
                const torsoScale = torsoLength > 0 ? torsoLength / referenceTorsoLength : shoulderScale
                const hipScale = hipWidth > 0 ? hipWidth / referenceHipWidth : shoulderScale
                
                // Weighted combination based on reliability
                let finalScale = shoulderScale * 0.5 + torsoScale * 0.35 + hipScale * 0.15
                
                // Adjust scale based on model aspect ratio
                const modelAspect = modelDimensionsRef.current.height / modelDimensionsRef.current.width
                if (modelAspect > 2) {
                  // Tall model (dress, coat) - prioritize torso length
                  finalScale = torsoScale * 0.6 + shoulderScale * 0.4
                } else if (modelAspect < 1) {
                  // Wide model (shirt) - prioritize shoulder width  
                  finalScale = shoulderScale * 0.7 + torsoScale * 0.3
                }
                
                // Distance normalization
                finalScale = finalScale * 0.25
                
                // Convert from normalized coords to NDC
                const videoWidth = video.videoWidth || 1280
                const videoHeight = video.videoHeight || 720
                const aspect = videoWidth / Math.max(1, videoHeight)
                
                const ndcX = (shoulderCenterX * 2 - 1) * aspect
                const ndcY = -(shoulderCenterY * 2 - 1)
                
                // Smart vertical positioning based on model type
                let offsetY = 0.05
                if (torsoLength > 0) {
                  if (modelAspect > 2) {
                    offsetY = torsoLength * 0.15
                  } else if (modelAspect > 1.2) {
                    offsetY = torsoLength * 0.25  
                  } else {
                    offsetY = torsoLength * 0.35
                  }
                }
                
                // Apply exponential smoothing to reduce jitter
                const rawPose = {
                  x: ndcX,
                  y: ndcY + offsetY,
                  scale: Math.max(0.08, Math.min(0.5, finalScale))
                }
                
                // Add to history
                poseHistoryRef.current.push(rawPose)
                if (poseHistoryRef.current.length > 5) {
                  poseHistoryRef.current.shift()
                }
                
                // Calculate smoothed values using exponential moving average
                let smoothedPose = rawPose
                if (poseHistoryRef.current.length >= 2) {
                  const prev = poseHistoryRef.current[poseHistoryRef.current.length - 2]
                  smoothedPose = {
                    x: prev.x * (1 - smoothingFactor) + rawPose.x * smoothingFactor,
                    y: prev.y * (1 - smoothingFactor) + rawPose.y * smoothingFactor,
                    scale: prev.scale * (1 - smoothingFactor) + rawPose.scale * smoothingFactor
                  }
                }
                
                // Update auto pose with smoothed values
                setAutoPose({
                  x: smoothedPose.x,
                  y: smoothedPose.y,
                  scale: smoothedPose.scale,
                  shoulderWidth: shoulderWidth
                })
              }
            } else {
              setPoseDetected(false)
            }
          } catch (err) {
            console.error("Pose detection error:", err)
          }
        }
      }

      const model = modelRef.current
      if (model && modelLoaded) {
        if (poseTracking && poseDetected) {
          // Use automatic pose positioning with adaptive scaling
          model.position.set(autoPose.x, autoPose.y, 0)
          
          // Adaptive scale multiplier based on model dimensions
          const modelAspect = modelDimensionsRef.current.height / modelDimensionsRef.current.width
          let scaleMultiplier = 0.18
          
          if (modelAspect > 2) {
            scaleMultiplier = 0.14 // Tall models need smaller multiplier
          } else if (modelAspect < 1) {
            scaleMultiplier = 0.22 // Wide models need larger multiplier
          }
          
          model.scale.setScalar(autoPose.scale * scaleMultiplier)
        } else {
          // Use manual controls
          model.position.set(modelPosition.x, modelPosition.y, 0)
          model.scale.setScalar(modelScale * 0.25)
        }
        model.rotation.y = (modelRotation * Math.PI) / 180
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [cameraActive, modelLoaded, modelScale, modelRotation, modelPosition, poseTracking, poseDetected, autoPose])

  // Start camera
  const startCamera = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                resolve()
              }).catch(err => {
                console.error("Video play error:", err)
                resolve()
              })
            }
          }
        })
        
        setCameraActive(true)
      }

      setLoading(false)
    } catch (err: any) {
      console.error("Camera error:", err)
      let errorMessage = "Failed to access camera. "
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera access in your browser settings."
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera found on this device."
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application."
      } else if (err.message && err.message.includes("not supported")) {
        errorMessage += "Your browser doesn't support camera access. Try Chrome or Firefox."
      } else {
        errorMessage += `${err.message || 'Please check your camera permissions and try again.'}`
      }
      
      setError(errorMessage)
      setLoading(false)
      setCameraActive(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setModelLoaded(false)
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return

    const tempCanvas = document.createElement("canvas")
    const video = videoRef.current
    tempCanvas.width = video.videoWidth
    tempCanvas.height = video.videoHeight
    
    const ctx = tempCanvas.getContext("2d")
    if (!ctx) return

    // Draw video
    ctx.drawImage(video, 0, 0)
    
    // Draw 3D overlay
    ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height)

    // Download
    tempCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tryon-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Reset controls
  const resetControls = () => {
    setModelScale(0.5)
    setModelRotation(0)
    setModelPosition({ x: 0, y: 0.1 })
  }

  return (
    <div className={`relative ${className}`}>
      {!cameraActive ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <Camera className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Virtual Try-On</h3>
          <p className="text-slate-400 mb-6">
            Try on this item using your camera. We'll overlay the 3D model so you can see how it looks!
          </p>
          
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={startCamera}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Starting Camera...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </>
            )}
          </Button>
          
          <p className="text-slate-500 text-xs mt-4">
            Your camera will only be used locally. No images are uploaded.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: "400px" }}>
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto block"
            style={{ transform: "scaleX(-1)", maxHeight: "80vh" }}
          />

          {/* 3D Model overlay canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3" />
                <p className="text-white">Loading 3D model...</p>
              </div>
            </div>
          )}

          {/* Pose Tracking Status */}
          {poseTracking && (
            <div className="absolute top-4 left-4 right-4">
              <div className={`bg-slate-900/90 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Scan className={`h-4 w-4 ${poseDetected ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className="text-white text-sm">
                    {poseDetected ? '✓ Body Detected - Auto Tracking' : '⚠ Looking for body...'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPoseTracking(false)}
                  className="bg-slate-800 border-slate-700 text-white h-7 text-xs"
                >
                  Switch to Manual
                </Button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="bg-slate-900/90 backdrop-blur rounded-lg p-4 space-y-4">
              {/* Tracking Mode Toggle */}
              {!poseTracking && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-white text-sm">Manual Mode</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoseTracking(true)}
                    className="bg-green-800 border-green-700 text-white h-8"
                  >
                    <Scan className="h-4 w-4 mr-1" />
                    Enable Auto Tracking
                  </Button>
                </div>
              )}
              {/* Scale Control - Only show in manual mode */}
              {!poseTracking && (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm w-20">Scale:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModelScale(Math.max(0.1, modelScale - 0.05))}
                  className="bg-slate-800 border-slate-700 text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModelScale(Math.min(3, modelScale + 0.05))}
                  className="bg-slate-800 border-slate-700 text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              )}

              {/* Rotation Control */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm w-20">Rotate:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={modelRotation}
                  onChange={(e) => setModelRotation(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white text-sm w-12">{modelRotation}°</span>
              </div>

              {/* Position Control - Only show in manual mode */}
              {!poseTracking && (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm w-20">Position Y:</span>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={modelPosition.y}
                  onChange={(e) => setModelPosition({ ...modelPosition, y: parseFloat(e.target.value) })}
                  className="flex-1"
                />
              </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={resetControls}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={capturePhoto}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-red-800 border-red-700 text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
