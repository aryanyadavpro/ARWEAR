"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { Button } from "./ui/button"
import { Camera, X, RotateCcw, Scan } from "lucide-react"

interface CameraTryonProps {
  modelUrl: string
  className?: string
}

export default function CameraTryon({ modelUrl, className = "" }: CameraTryonProps) {
  console.log('🎬 CameraTryon component rendered with modelUrl:', modelUrl)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const animationRef = useRef<number | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const lastVideoTimeRef = useRef(-1)

  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [poseDetected, setPoseDetected] = useState(false)
  const [autoTracking, setAutoTracking] = useState(true)
  
  // Model controls
  const [modelScale, setModelScale] = useState(0.35)
  const [modelRotation, setModelRotation] = useState(0)
  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0.15 })
  
  // Auto pose position from body tracking
  const [autoPose, setAutoPose] = useState({ x: 0, y: 0.15, scale: 0.35 })

  // Start camera
  const startCamera = async () => {
    console.log('🎥 Starting camera...')
    try {
      setLoading(true)
      setError(null)

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      console.log('✅ Camera stream obtained')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
              console.log('✅ Video playing')
              resolve()
            }
          }
        })
        
        setCameraActive(true)
        console.log('✅ Camera activated')
      }

      setLoading(false)
    } catch (err: any) {
      console.error('❌ Camera error:', err)
      setError(err.message || 'Failed to access camera')
      setLoading(false)
    }
  }

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Setup 3D scene when camera starts
  useEffect(() => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    const setupScene = () => {
      const videoWidth = video.videoWidth || 1280
      const videoHeight = video.videoHeight || 720
      
      console.log('📐 Video dimensions:', videoWidth, 'x', videoHeight)
      
      canvas.width = videoWidth
      canvas.height = videoHeight
      
      // Create scene
      const scene = new THREE.Scene()
      const aspect = videoWidth / videoHeight
      const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000)
      camera.position.z = 5

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        alpha: true,
        antialias: true
      })
      renderer.setSize(videoWidth, videoHeight)
      renderer.setClearColor(0x000000, 0)

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
      scene.add(ambientLight)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
      directionalLight.position.set(2, 2, 5)
      scene.add(directionalLight)

      sceneRef.current = scene
      cameraRef.current = camera
      rendererRef.current = renderer

      console.log('✅ 3D scene created')

      // Load 3D model
      const loader = new GLTFLoader()
      console.log('📦 Loading model:', modelUrl)
      
      loader.load(
        modelUrl,
        (gltf) => {
          console.log('✅ Model loaded successfully')
          const model = gltf.scene
          
          // Center and normalize model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          
          console.log('📏 Model size:', size)
          
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 0.3 / maxDim
          
          model.position.sub(center)
          model.scale.setScalar(scale)
          
          scene.add(model)
          modelRef.current = model
          setModelLoaded(true)
          console.log('✅ Model added to scene')
        },
        (progress) => {
          console.log('📦 Loading:', Math.round((progress.loaded / progress.total) * 100) + '%')
        },
        (err) => {
          console.error('❌ Model load error:', err)
          setError('Failed to load 3D model')
        }
      )
    }
    
    if (video.readyState >= 2) {
      setupScene()
    } else {
      video.addEventListener('loadedmetadata', setupScene, { once: true })
    }

    return () => {
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
        console.log('🧠 Initializing pose detection...')
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
        console.log('✅ Pose detection ready')
      } catch (err) {
        console.error('❌ Failed to initialize pose detection:', err)
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

      // Detect pose if auto tracking is enabled
      if (autoTracking && poseLandmarkerRef.current && modelLoaded) {
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
                // Calculate shoulder center and width
                const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2
                const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2
                const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
                
                // Convert to NDC coordinates
                const videoWidth = video.videoWidth || 1280
                const videoHeight = video.videoHeight || 720
                const aspect = videoWidth / videoHeight
                
                const ndcX = (shoulderCenterX * 2 - 1) * aspect
                const ndcY = -(shoulderCenterY * 2 - 1)
                
                // Auto scale based on shoulder width
                const referenceShoulderWidth = 0.18
                const scale = (shoulderWidth / referenceShoulderWidth) * 0.25
                
                // Update auto pose
                setAutoPose({
                  x: ndcX,
                  y: ndcY + 0.15, // Offset down a bit from shoulders
                  scale: Math.max(0.1, Math.min(0.5, scale))
                })
              }
            } else {
              setPoseDetected(false)
            }
          } catch (err) {
            // Silently handle pose detection errors
          }
        }
      }

      const model = modelRef.current
      if (model && modelLoaded) {
        if (autoTracking && poseDetected) {
          // Use auto-tracked position
          model.position.set(autoPose.x, autoPose.y, 0)
          model.scale.setScalar(autoPose.scale)
        } else {
          // Use manual position
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
  }, [cameraActive, modelLoaded, modelScale, modelRotation, modelPosition, autoTracking, poseDetected, autoPose])

  return (
    <div className={`relative ${className}`}>
      {!cameraActive ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center">
          {error ? (
            <>
              <Camera className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Camera Access Required</h3>
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 max-w-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <Button
                onClick={startCamera}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3"
              >
                <Camera className="h-5 w-5 mr-2" />
                Retry Camera Access
              </Button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Activating Camera...</h3>
              <p className="text-slate-400">
                Please allow camera access when prompted
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: "500px" }}>
          {/* Camera feed with overlay */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto block"
              style={{ transform: "scaleX(-1)" }}
            />
            
            {/* 3D overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          {/* Loading overlay */}
          {!modelLoaded && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3" />
                <p className="text-white">Loading 3D model...</p>
              </div>
            </div>
          )}

          {/* Tracking Status */}
          {modelLoaded && (
            <div className="absolute top-4 left-4 right-4">
              <div className="bg-slate-900/90 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className={`h-4 w-4 ${poseDetected ? 'text-green-400' : 'text-yellow-400'}`} />
                  <span className="text-white text-sm">
                    {autoTracking ? (
                      poseDetected ? '✅ Body Detected - Auto Tracking' : '⚠️ Looking for body...'
                    ) : (
                      '🔧 Manual Mode'
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAutoTracking(!autoTracking)}
                  className="bg-slate-800 border-slate-700 text-white h-7 text-xs"
                >
                  {autoTracking ? 'Switch to Manual' : 'Enable Auto Tracking'}
                </Button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-slate-900/90 backdrop-blur rounded-lg p-4 space-y-4">
              {/* Manual controls - only show when auto tracking is off */}
              {!autoTracking && (
                <>
                  {/* Scale */}
                  <div>
                    <label className="text-white text-sm block mb-2">Size: {modelScale.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.01"
                      value={modelScale}
                      onChange={(e) => setModelScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Position Y */}
                  <div>
                    <label className="text-white text-sm block mb-2">Position: {modelPosition.y.toFixed(2)}</label>
                    <input
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.01"
                      value={modelPosition.y}
                      onChange={(e) => setModelPosition({ ...modelPosition, y: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {/* Rotation */}
              <div>
                <label className="text-white text-sm block mb-2">Rotation: {modelRotation}°</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={modelRotation}
                  onChange={(e) => setModelRotation(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setModelScale(0.35)
                    setModelRotation(0)
                    setModelPosition({ x: 0, y: 0.15 })
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-red-800 border-red-700 text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
