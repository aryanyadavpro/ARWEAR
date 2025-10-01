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
        // Secure context check for camera on mobile browsers
        if (!(window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
          throw new Error('Camera requires HTTPS or localhost')
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
         const animate = async (now?: number) => {
          if (!isMounted) return
          const v = videoRef.current

          if (v && detectorRef.current && modelRef.current) {
            // Guard: video metadata must be ready
            if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
              try {
                // Throttle detection
                if (!lastDetect || (now ?? performance.now()) - lastDetect >= DETECT_INTERVAL) {
                  lastDetect = (now ?? performance.now())
                  // Downscale input to speed up detection
                  const aspect = v.videoWidth / v.videoHeight
                  const W = 320
                  off.width = W
                  off.height = Math.max(1, Math.round(W / aspect))
                  const octx = off.getContext('2d')!
                  octx.drawImage(v, 0, 0, off.width, off.height)

                  const poses = await detectorRef.current.estimatePoses(off, { flipHorizontal: true })
                  if (poses[0]) {
                    const kp = poses[0].keypoints
                    const left = kp.find(k => k.name === "left_shoulder")
                    const right = kp.find(k => k.name === "right_shoulder")
                    if (left && right && left.score! > 0.5 && right.score! > 0.5) {
                      const midX = (left.x + right.x) / 2
                      const midY = (left.y + right.y) / 2
                      const dx = right.x - left.x
                      const dy = right.y - left.y
                      const angle = Math.atan2(dy, dx)

                      const nx = (midX / off.width) * 2 - 1
                      const ny = -(midY / off.height) * 2 + 1

                      // Map to orthographic world coords (x scaled by aspect)
                      const r = rendererRef.current
                      const a = r ? (r.domElement.clientWidth / Math.max(1, r.domElement.clientHeight)) : 1
                      const x = nx * a
                      const y = ny
                      modelRef.current.position.set(x, y, 0)
                      modelRef.current.rotation.set(0, 0, angle)

                      // Scale to shoulder width proportion
                      const shoulderDist = Math.hypot(dx, dy) / off.width
                      const s = Math.max(0.25, Math.min(1.5, shoulderDist * 1.8))
                      modelRef.current.scale.setScalar(s)
                    }
                  }
                }
                if (poses[0]) {
                  const kp = poses[0].keypoints
                  const left = kp.find(k => k.name === "left_shoulder")
                  const right = kp.find(k => k.name === "right_shoulder")
                  if (left && right && left.score! > 0.5 && right.score! > 0.5) {
                    const midX = (left.x + right.x) / 2
                    const midY = (left.y + right.y) / 2
                    const dx = right.x - left.x
                    const dy = right.y - left.y
                    const angle = Math.atan2(dy, dx)

                    const nx = (midX / v.videoWidth) * 2 - 1
                    const ny = -(midY / v.videoHeight) * 2 + 1

                    // Map to orthographic world coords (x scaled by aspect)
                    const r = rendererRef.current
                    const a = r ? (r.domElement.clientWidth / Math.max(1, r.domElement.clientHeight)) : 1
                    const x = nx * a
                    const y = ny
                    modelRef.current.position.set(x, y, 0)
                    modelRef.current.rotation.set(0, 0, angle)

                    // Scale to shoulder width proportion
                    const shoulderDist = Math.hypot(dx, dy) / v.videoWidth
                    const s = Math.max(0.25, Math.min(1.5, shoulderDist * 1.8))
                    modelRef.current.scale.setScalar(s)
                  }
                }
              } catch (e) {
                // Swallow intermittent detector errors without crashing the render loop
              }
            }
          }

          renderer.render(scene, camera)
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
          // @ts-ignore
          if (obj.material) {
            const m: any = obj.material
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

