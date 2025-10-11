"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as posedetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"

type Props = {
  modelUrl: string
  onReadyChange?: (ready: boolean) => void
}

// Clothing type detection based on model file name
type ClothingType = 'shirt' | 'jacket' | 'pants' | 'dress' | 'accessory'

function getClothingType(modelUrl: string): ClothingType {
  const filename = modelUrl.toLowerCase()
  if (filename.includes('jacket')) return 'jacket'
  if (filename.includes('pants') || filename.includes('trouser')) return 'pants'
  if (filename.includes('dress')) return 'dress'
  if (filename.includes('shirt') || filename.includes('tee') || filename.includes('t-shirt')) return 'shirt'
  return 'shirt' // default
}

export default function TryOn3D({ modelUrl, onReadyChange }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const detectorRef = useRef<posedetection.PoseDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Initializing...")

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        // Secure context check for camera (required for getUserMedia)
        if (!window.isSecureContext) {
          throw new Error('Camera access requires HTTPS (secure context)')
        }

        // TFJS backend with fallback
        try {
          await tf.setBackend('webgl')
        } catch {}
        await tf.ready()
        if (tf.getBackend() !== 'webgl') {
          try { await tf.setBackend('cpu') } catch {}
        }

        setStatus('Requesting camera...')
        // Camera (works on desktop and mobile)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            ...(isIOS ? { frameRate: { ideal: 30, max: 30 } } : {})
          }
        }
        streamRef.current = await navigator.mediaDevices.getUserMedia(constraints)
        if (!isMounted) return

        const video = videoRef.current
        if (!video) return
        video.srcObject = streamRef.current
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        await video.play()
        // Ensure metadata is available before using videoWidth/Height
        await new Promise<void>((resolve) => {
          if (!isMounted) return resolve()
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) return resolve()
          const onMeta = () => {
            video.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          video.addEventListener('loadedmetadata', onMeta)
        })
        setStatus('Starting renderer...')

        // Three.js with transparent background overlaying the video
        const scene = new THREE.Scene()
        sceneRef.current = scene

        // Use orthographic camera so NDC mapping is straightforward
        const overlay = overlayRef.current!
        const aspect = overlay.clientWidth / Math.max(1, overlay.clientHeight)
        const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.01, 10)
        camera.position.set(0, 0, 2)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setClearColor(0x000000, 0) // fully transparent
        rendererRef.current = renderer

        overlay.innerHTML = ''
        overlay.appendChild(renderer.domElement)
        const resize = () => {
          const w = overlay.clientWidth
          const h = overlay.clientHeight
          renderer.setSize(w, h, false)
          const a = w / Math.max(1, h)
          camera.left = -a
          camera.right = a
          camera.top = 1
          camera.bottom = -1
          camera.updateProjectionMatrix()
        }
        resize()
        window.addEventListener("resize", resize)

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 1))
        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(1, 1, 1)
        scene.add(dir)

        // Load model
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(modelUrl)
        modelRef.current = gltf.scene
        gltf.scene.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = false
            obj.receiveShadow = false
          }
        })
        // Normalize model size and center it so it is visible immediately
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = new THREE.Vector3()
        box.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scaleFactor = 0.6 / maxDim
        gltf.scene.scale.setScalar(scaleFactor)
        const center = new THREE.Vector3()
        box.getCenter(center)
        gltf.scene.position.sub(center) // center the pivot at origin
        scene.add(gltf.scene)

        // Pose detector (lite for performance)
        detectorRef.current = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
          runtime: "tfjs",
          modelType: "lite",
        })

        onReadyChange?.(true)
        setStatus('Ready for try-on!')
        
        // Animation variables
        let lastDetect = 0
        const DETECT_INTERVAL = 100 // ms between pose detections
        const offscreenCanvas = document.createElement('canvas')
        const clothingType = getClothingType(modelUrl)
        
        // Body attachment points based on clothing type
        function getAttachmentPoints(keypoints: any[], type: ClothingType) {
          const kp = keypoints
          const leftShoulder = kp.find(k => k.name === "left_shoulder")
          const rightShoulder = kp.find(k => k.name === "right_shoulder")
          const leftHip = kp.find(k => k.name === "left_hip")
          const rightHip = kp.find(k => k.name === "right_hip")
          const nose = kp.find(k => k.name === "nose")
          
          switch (type) {
            case 'shirt':
            case 'jacket':
              return { leftShoulder, rightShoulder, leftHip, rightHip }
            case 'pants':
              return { leftHip, rightHip }
            case 'dress':
              return { leftShoulder, rightShoulder, leftHip, rightHip }
            default:
              return { leftShoulder, rightShoulder }
          }
        }
        
        // Calculate body measurements and positioning
        function calculateBodyFit(attachmentPoints: any, videoWidth: number, videoHeight: number) {
          const { leftShoulder, rightShoulder, leftHip, rightHip } = attachmentPoints
          
          // Check if we have minimum required points
          if (!leftShoulder || !rightShoulder || 
              leftShoulder.score < 0.5 || rightShoulder.score < 0.5) {
            return null
          }
          
          // Calculate shoulder measurements
          const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
          const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2
          const shoulderWidth = Math.hypot(
            rightShoulder.x - leftShoulder.x,
            rightShoulder.y - leftShoulder.y
          )
          const shoulderAngle = Math.atan2(
            rightShoulder.y - leftShoulder.y,
            rightShoulder.x - leftShoulder.x
          )
          
          // Calculate torso length if we have hip points
          let torsoLength = shoulderWidth * 1.5 // default fallback
          let hipMidX = shoulderMidX
          let hipMidY = shoulderMidY + torsoLength
          
          if (leftHip && rightHip && leftHip.score > 0.3 && rightHip.score > 0.3) {
            hipMidX = (leftHip.x + rightHip.x) / 2
            hipMidY = (leftHip.y + rightHip.y) / 2
            torsoLength = Math.hypot(
              hipMidX - shoulderMidX,
              hipMidY - shoulderMidY
            )
          }
          
          // Convert to normalized device coordinates
          const nx = (shoulderMidX / videoWidth) * 2 - 1
          const ny = -(shoulderMidY / videoHeight) * 2 + 1
          
          return {
            centerX: nx,
            centerY: ny,
            shoulderWidth: shoulderWidth / videoWidth,
            torsoLength: torsoLength / videoHeight,
            angle: shoulderAngle
          }
        }
        
        const animate = async (now?: number) => {
          if (!isMounted) return
          const video = videoRef.current
          const model = modelRef.current
          const detector = detectorRef.current
          
          if (video && detector && model && 
              video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            try {
              // Throttle pose detection for performance
              const currentTime = now ?? performance.now()
              if (currentTime - lastDetect >= DETECT_INTERVAL) {
                lastDetect = currentTime
                
                // Downscale video for faster pose detection
                const aspectRatio = video.videoWidth / video.videoHeight
                const detectionWidth = 320
                const detectionHeight = Math.round(detectionWidth / aspectRatio)
                
                offscreenCanvas.width = detectionWidth
                offscreenCanvas.height = detectionHeight
                const ctx = offscreenCanvas.getContext('2d')!
                ctx.drawImage(video, 0, 0, detectionWidth, detectionHeight)
                
                // Detect poses with horizontal flip for mirror effect
                const poses = await detector.estimatePoses(offscreenCanvas, { 
                  flipHorizontal: true 
                })
                
                if (poses[0] && poses[0].keypoints) {
                  const attachmentPoints = getAttachmentPoints(poses[0].keypoints, clothingType)
                  const bodyFit = calculateBodyFit(attachmentPoints, detectionWidth, detectionHeight)
                  
                  if (bodyFit) {
                    // Map to Three.js orthographic coordinates
                    const renderer = rendererRef.current
                    const camera = cameraRef.current
                    if (renderer && camera) {
                      const aspect = renderer.domElement.clientWidth / 
                                   Math.max(1, renderer.domElement.clientHeight)
                      
                      // Position the model at the body center
                      const worldX = bodyFit.centerX * aspect
                      const worldY = bodyFit.centerY
                      model.position.set(worldX, worldY, 0)
                      
                      // Rotate to match shoulder angle
                      model.rotation.set(0, 0, bodyFit.angle)
                      
                      // Scale based on body measurements
                      let scaleX = bodyFit.shoulderWidth * 2.5 // adjust for clothing fit
                      let scaleY = bodyFit.torsoLength * 1.8
                      let scaleZ = Math.min(scaleX, scaleY)
                      
                      // Clothing-specific scaling adjustments
                      switch (clothingType) {
                        case 'shirt':
                        case 'jacket':
                          scaleY *= 0.8 // shirts are shorter than full torso
                          break
                        case 'pants':
                          scaleY *= 1.2 // pants are longer
                          model.position.y -= 0.2 // position lower on body
                          break
                        case 'dress':
                          scaleY *= 1.3 // dresses are longer
                          break
                      }
                      
                      // Clamp scaling to reasonable bounds
                      scaleX = Math.max(0.3, Math.min(2.0, scaleX))
                      scaleY = Math.max(0.3, Math.min(2.0, scaleY))
                      scaleZ = Math.max(0.3, Math.min(2.0, scaleZ))
                      
                      model.scale.set(scaleX, scaleY, scaleZ)
                    }
                  }
                }
              }
            } catch (error) {
              // Silently handle pose detection errors to prevent UI crashes
              console.warn('Pose detection error:', error)
            }
          }
          
          // Render the scene
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current)
          }
          
          rafRef.current = requestAnimationFrame(animate)
        }
        
        animate()

        return () => {
          window.removeEventListener("resize", resize)
        }
      } catch (e: any) {
        console.error(e)
        setError(e.message || "3D try-on failed")
        onReadyChange?.(false)
        setStatus('')
      }
    }

    init()

    return () => {
      isMounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current.forceContextLoss()
      }
      if (sceneRef.current) {
        sceneRef.current.traverse(obj => {
          // @ts-ignore
          if (obj.geometry) obj.geometry.dispose?.()
          // @ts-ignore - Three.js type casting
          if ((obj as any).material) {
            const m: any = (obj as any).material
            if (m.map) m.map.dispose?.()
            m.dispose?.()
          }
        })
      }
      if (detectorRef.current) detectorRef.current.dispose()
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [modelUrl, onReadyChange])

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          style={{ transform: 'scaleX(-1)', zIndex: 1 }}
        />
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ transform: 'scaleX(-1)', zIndex: 2 }}
        />
        {!error && status && (
          <div className="absolute bottom-2 left-2 bg-slate-900/70 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 z-20">
            {status}
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-400">{error}</div>
      )}
    </div>
  )
}

