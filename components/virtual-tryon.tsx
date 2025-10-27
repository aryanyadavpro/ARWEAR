"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import { Button } from "./ui/button"
import { Camera, X, RotateCcw, Scan, ZoomIn, ZoomOut } from "lucide-react"

interface VirtualTryonProps {
  modelUrl: string
  className?: string
}

export default function VirtualTryon({ modelUrl, className = "" }: VirtualTryonProps) {
  console.log('🎬 VirtualTryon initialized with modelUrl:', modelUrl)
  
  // Refs for video and 3D rendering
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // MediaStream and THREE.js refs
  const streamRef = useRef<MediaStream | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Pose detection refs
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const lastVideoTimeRef = useRef(-1)
  
  // State management
  const [initialized, setInitialized] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Tracking state
  const [autoTrack, setAutoTrack] = useState(true)
  const [bodyDetected, setBodyDetected] = useState(false)
  
  // Manual controls
  const [scale, setScale] = useState(0.4)
  const [posY, setPosY] = useState(0.1)
  const [rotation, setRotation] = useState(0)
  
  // Auto tracking position
  const [autoPosition, setAutoPosition] = useState({ x: 0, y: 0.1, scale: 0.4 })

  // Step 1: Initialize camera on mount
  useEffect(() => {
    let mounted = true
    
    const initCamera = async () => {
      console.log('📹 Step 1: Initializing camera...')
      
      try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported in this browser')
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        console.log('✅ Camera stream obtained')
        streamRef.current = stream

        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Add timeout for video loading
          const timeout = setTimeout(() => {
            console.error('❌ Video load timeout')
            if (mounted) {
              setError('Camera loading timed out. Please refresh and try again.')
              setLoading(false)
            }
          }, 10000) // 10 second timeout
          
          // Wait for video to load
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout)
            console.log('✅ Video metadata loaded')
            videoRef.current?.play().then(() => {
              console.log('✅ Video playing')
              if (mounted) {
                setCameraReady(true)
              }
            }).catch(err => {
              console.error('❌ Video play error:', err)
              if (mounted) {
                setError('Failed to start video playback: ' + err.message)
                setLoading(false)
              }
            })
          }
          
          videoRef.current.onerror = (err) => {
            clearTimeout(timeout)
            console.error('❌ Video error:', err)
            if (mounted) {
              setError('Video stream error. Please check your camera.')
              setLoading(false)
            }
          }
        }
      } catch (err: any) {
        console.error('❌ Camera initialization error:', err)
        if (mounted) {
          if (err.name === 'NotAllowedError') {
            setError('Camera permission denied. Please allow camera access.')
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.')
          } else {
            setError(err.message || 'Failed to access camera')
          }
          setLoading(false)
        }
      }
    }

    initCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Step 2: Setup 3D scene when camera is ready
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !canvasRef.current) return

    console.log('🎨 Step 2: Setting up 3D scene...')
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Get video dimensions
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    
    console.log('📐 Video dimensions:', videoWidth, 'x', videoHeight)
    
    // Set canvas size
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    // Create THREE.js scene
    const scene = new THREE.Scene()
    const aspect = videoWidth / videoHeight
    const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000)
    camera.position.z = 5
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    })
    renderer.setSize(videoWidth, videoHeight)
    renderer.setClearColor(0x000000, 0)
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
    directionalLight.position.set(2, 2, 5)
    scene.add(directionalLight)
    
    // Store refs
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    
    console.log('✅ 3D scene created')
    
    // Load 3D model
    console.log('📦 Step 3: Loading 3D model from:', modelUrl)
    const loader = new GLTFLoader()
    
    loader.load(
      modelUrl,
      (gltf) => {
        console.log('✅ Model loaded successfully')
        const model = gltf.scene
        
        // Calculate model bounds
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('📏 Model size:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2))
        
        // Center model
        model.position.sub(center)
        
        // Normalize scale
        const maxDim = Math.max(size.x, size.y, size.z)
        const normalizeScale = 0.3 / maxDim
        model.scale.setScalar(normalizeScale)
        
        scene.add(model)
        modelRef.current = model
        
        setModelLoaded(true)
        setLoading(false)
        console.log('✅ Model added to scene')
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100)
        console.log('📦 Loading model:', percent + '%')
      },
      (err) => {
        console.error('❌ Model load error:', err)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )
    
    // Cleanup
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [cameraReady, modelUrl])

  // Step 3: Initialize pose detection when model is loaded
  useEffect(() => {
    if (!modelLoaded || !autoTrack) return

    console.log('🧠 Step 4: Initializing pose detection...')
    
    let mounted = true
    
    const initPoseDetection = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        })
        
        if (mounted) {
          poseLandmarkerRef.current = poseLandmarker
          console.log('✅ Pose detection ready')
        }
      } catch (err) {
        console.error('❌ Pose detection init error:', err)
      }
    }
    
    initPoseDetection()
    
    return () => {
      mounted = false
      poseLandmarkerRef.current?.close()
    }
  }, [modelLoaded, autoTrack])

  // Step 4: Animation loop
  useEffect(() => {
    if (!cameraReady || !modelLoaded || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
      return
    }

    console.log('🎬 Step 5: Starting animation loop...')
    
    const animate = () => {
      if (!videoRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return
      }

      // Pose detection
      if (autoTrack && poseLandmarkerRef.current) {
        const video = videoRef.current
        const currentTime = video.currentTime
        
        if (currentTime !== lastVideoTimeRef.current && currentTime > 0) {
          lastVideoTimeRef.current = currentTime
          
          try {
            const results = poseLandmarkerRef.current.detectForVideo(video, performance.now())
            
            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0]
              
              // Get shoulders (11: left, 12: right)
              const leftShoulder = landmarks[11]
              const rightShoulder = landmarks[12]
              
              if (leftShoulder && rightShoulder) {
                setBodyDetected(true)
                
                // Calculate center and width
                const centerX = (leftShoulder.x + rightShoulder.x) / 2
                const centerY = (leftShoulder.y + rightShoulder.y) / 2
                const width = Math.abs(rightShoulder.x - leftShoulder.x)
                
                // Convert to NDC
                const videoWidth = video.videoWidth || 1280
                const videoHeight = video.videoHeight || 720
                const aspect = videoWidth / videoHeight
                
                const ndcX = (centerX * 2 - 1) * aspect
                const ndcY = -(centerY * 2 - 1)
                
                // Scale based on shoulder width
                const refWidth = 0.18
                const calculatedScale = (width / refWidth) * 0.3
                
                setAutoPosition({
                  x: ndcX,
                  y: ndcY + 0.2, // Offset below shoulders
                  scale: Math.max(0.15, Math.min(0.6, calculatedScale))
                })
              }
            } else {
              setBodyDetected(false)
            }
          } catch (err) {
            // Silent fail
          }
        }
      }

      // Update model position
      const model = modelRef.current
      if (model) {
        if (autoTrack && bodyDetected) {
          model.position.set(autoPosition.x, autoPosition.y, 0)
          model.scale.setScalar(autoPosition.scale)
        } else {
          model.position.set(0, posY, 0)
          model.scale.setScalar(scale * 0.25)
        }
        model.rotation.y = (rotation * Math.PI) / 180
      }

      // Render
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [cameraReady, modelLoaded, autoTrack, bodyDetected, autoPosition, scale, posY, rotation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
      poseLandmarkerRef.current?.close()
    }
  }, [])

  // Render UI
  if (error) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center ${className}`}>
        <Camera className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-400 mb-2">Camera Error</h3>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
        <p className="text-slate-400 text-sm">Please refresh the page and allow camera access</p>
      </div>
    )
  }

  if (!cameraReady) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-200 mb-2">Starting Camera...</h3>
        <p className="text-slate-400">Please allow camera access when prompted</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '500px' }} ref={containerRef}>
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto block"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* 3D overlay */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Loading model overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3" />
              <p className="text-white font-medium">Loading 3D Model...</p>
            </div>
          </div>
        )}
        
        {/* Tracking status */}
        {modelLoaded && (
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-slate-900/90 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className={`h-4 w-4 ${bodyDetected ? 'text-green-400' : 'text-yellow-400'}`} />
                <span className="text-white text-sm font-medium">
                  {autoTrack ? (
                    bodyDetected ? '✅ Body Tracked' : '⚠️ Looking for body...'
                  ) : (
                    '🎮 Manual Control'
                  )}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoTrack(!autoTrack)}
                className="bg-slate-800 border-slate-700 text-white h-7 text-xs hover:bg-slate-700"
              >
                {autoTrack ? 'Manual' : 'Auto Track'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Controls */}
        {modelLoaded && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-slate-900/95 backdrop-blur rounded-lg p-4 space-y-3">
              {/* Manual controls */}
              {!autoTrack && (
                <>
                  <div>
                    <label className="text-white text-xs font-medium block mb-1">
                      Size: {scale.toFixed(2)}
                    </label>
                    <div className="flex items-center gap-2">
                      <ZoomOut className="h-4 w-4 text-slate-400" />
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.01"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <ZoomIn className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-white text-xs font-medium block mb-1">
                      Position: {posY.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.01"
                      value={posY}
                      onChange={(e) => setPosY(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="text-white text-xs font-medium block mb-1">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    setScale(0.4)
                    setPosY(0.1)
                    setRotation(0)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  onClick={() => {
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop())
                    }
                    window.location.reload()
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-red-800 border-red-700 text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
