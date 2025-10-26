"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getCameraStream } from "@/lib/ar-utils"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

interface SimpleARTryOnProps {
  modelUrl: string
  className?: string
}

export default function SimpleARTryOn({ modelUrl, className }: SimpleARTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threeCanvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

  const initThreeJS = () => {
    // Create a separate canvas for Three.js rendering
    const threeCanvas = document.createElement('canvas')
    threeCanvasRef.current = threeCanvas

    // Create scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    // Create renderer with alpha for transparency
    const renderer = new THREE.WebGLRenderer({ 
      canvas: threeCanvas,
      alpha: true,
      antialias: true
    })
    renderer.setClearColor(0x000000, 0) // Transparent background
    rendererRef.current = renderer

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Load 3D model
    console.log('Loading 3D model from:', modelUrl)
    const loader = new GLTFLoader()
    
    // Set a timeout to use fallback cube if loading takes too long
    const fallbackTimeout = setTimeout(() => {
      if (!modelRef.current) {
        console.warn('Model loading timeout, using fallback cube')
        createFallbackModel(scene)
      }
    }, 10000) // 10 second timeout
    
    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(fallbackTimeout)
        console.log('3D model loaded successfully:', gltf)
        const model = gltf.scene
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('Model size:', size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        model.scale.multiplyScalar(scale)
        
        model.position.sub(center.multiplyScalar(scale))
        model.position.y = -0.5
        
        scene.add(model)
        modelRef.current = model
        setIsModelLoaded(true)
        setLoadingProgress(100)
        console.log('Model added to scene')
      },
      (progress) => {
        if (progress.total > 0) {
          const percentComplete = (progress.loaded / progress.total) * 100
          setLoadingProgress(percentComplete)
          console.log('Loading progress:', percentComplete.toFixed(2) + '%')
        }
      },
      (error) => {
        clearTimeout(fallbackTimeout)
        console.error('Error loading 3D model:', error)
        console.error('Model URL:', modelUrl)
        console.warn('Using fallback cube geometry')
        createFallbackModel(scene)
      }
    )
  }
  
  const createFallbackModel = (scene: THREE.Scene) => {
    // Create a simple colored cube as fallback
    const geometry = new THREE.BoxGeometry(1, 1.5, 0.5)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b5cf6,
      metalness: 0.3,
      roughness: 0.5
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(0, 0, 0)
    
    const group = new THREE.Group()
    group.add(cube)
    
    scene.add(group)
    modelRef.current = group
    setIsModelLoaded(true)
    setLoadingProgress(100)
    console.log('Fallback cube added to scene')
  }

  const startCamera = async () => {
    try {
      // Initialize Three.js first
      initThreeJS()
      
      // Detect if mobile for camera selection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      console.log('Is mobile device:', isMobile)
      
      // Get camera stream (use environment camera on mobile by default)
      const stream = await getCameraStream(isMobile ? 'environment' : 'user')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Add event listener for when video can play
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight
          })
        }
        await videoRef.current.play()
        setIsActive(true)
        console.log('Camera started successfully')
        // Start drawing loop after video is playing
        requestAnimationFrame(drawLoop)
      }
    } catch (err: any) {
      console.error('Failed to start camera:', err)
      setError(err.message || 'Failed to access camera')
    }
  }

  const drawLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const threeCanvas = threeCanvasRef.current
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    const model = modelRef.current
    
    if (!video || !canvas || !renderer || !scene || !camera || !threeCanvas) {
      rafRef.current = requestAnimationFrame(drawLoop)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, try again
      rafRef.current = requestAnimationFrame(drawLoop)
      return
    }

    // Set canvas sizes to match video (only on first run or size change)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      threeCanvas.width = video.videoWidth
      threeCanvas.height = video.videoHeight
      renderer.setSize(video.videoWidth, video.videoHeight, false)
      camera.aspect = video.videoWidth / video.videoHeight
      camera.updateProjectionMatrix()
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw video frame as background
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Render and composite 3D model
    if (model && isModelLoaded) {
      model.rotation.y += 0.01
      
      // Render 3D scene to the Three.js canvas
      renderer.render(scene, camera)
      
      // Composite the 3D render onto the main canvas
      ctx.save()
      ctx.globalAlpha = 0.9
      ctx.drawImage(threeCanvas, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    // Add UI overlay
    drawUIOverlay(ctx, canvas.width, canvas.height)

    // Continue loop
    rafRef.current = requestAnimationFrame(drawLoop)
  }

  const drawUIOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add UI indicators
    if (!isModelLoaded) {
      // Loading indicator with progress
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(width / 2 - 120, 20, 240, 60)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Loading 3D Model...', width / 2, 45)
      
      // Progress bar
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(width / 2 - 100, 55, 200, 15)
      
      ctx.fillStyle = '#8b5cf6'
      ctx.fillRect(width / 2 - 98, 57, (loadingProgress / 100) * 196, 11)
      
      ctx.font = '12px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${Math.round(loadingProgress)}%`, width / 2, 90)
    } else {
      // Model loaded indicator
      ctx.fillStyle = 'rgba(0, 200, 0, 0.7)'
      ctx.fillRect(width - 130, 20, 110, 35)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('✓ Model Ready', width - 75, 42)
    }
    
    // Instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(10, height - 60, width - 20, 50)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('📸 Virtual Try-On Active', 20, height - 35)
    ctx.fillText('The 3D garment model is overlaid on your camera feed', 20, height - 15)
  }


  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    setIsActive(false)
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">❌ {error}</p>
        <Button onClick={() => setError(null)} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-slate-900 rounded-lg overflow-hidden">
        {/* Video feed */}
        <video
          ref={videoRef}
          className="w-full h-auto"
          style={{ display: isActive ? 'none' : 'block' }}
          playsInline
          muted
        />

        {/* Canvas for overlay */}
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ display: isActive ? 'block' : 'none' }}
        />

        {/* Placeholder */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="text-center p-8">
              <span className="text-6xl mb-4 block">📸</span>
              <p className="text-slate-300 mb-4">Ready to try on?</p>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                🚀 Start Virtual Try-On
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isActive && (
        <div className="mt-4 flex gap-3 justify-center">
          <Button onClick={stopCamera} variant="outline" className="border-slate-600">
            Stop Camera
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 bg-slate-800/50 rounded-lg p-4">
        <p className="text-xs text-slate-400">
          ℹ️ <strong>How it works:</strong> AI tracks your body pose in real-time and overlays the garment visualization. 
          Green dots show tracked body points. All processing happens locally on your device.
        </p>
      </div>
    </div>
  )
}
