"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as posedetection from "@tensorflow-models/pose-detection"
import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"

type Props = {
  modelUrl: string
  onReadyChange?: (ready: boolean) => void
}

export default function TryOn3D({ modelUrl, onReadyChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const detectorRef = useRef<posedetection.PoseDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        await tf.setBackend("webgl")
        await tf.ready()

        // Camera
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        if (!isMounted) return

        if (!videoRef.current) return
        videoRef.current.srcObject = streamRef.current
        await videoRef.current.play()

        // Three.js
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x000000)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.01, 100)
        camera.position.set(0, 0, 2)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        rendererRef.current = renderer

        const container = containerRef.current!
        container.appendChild(renderer.domElement)
        const resize = () => {
          const w = container.clientWidth
          const h = (w * 9) / 16
          renderer.setSize(w, h)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        }
        resize()
        window.addEventListener("resize", resize)

        scene.add(new THREE.AmbientLight(0xffffff, 1))
        const dir = new THREE.DirectionalLight(0xffffff, 0.6)
        dir.position.set(1, 1, 1)
        scene.add(dir)

        // Load model
        const loader = new GLTFLoader()
        const gltf = await loader.loadAsync(modelUrl)
        modelRef.current = gltf.scene
        gltf.scene.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
          }
        })
        scene.add(gltf.scene)

        // Pose detector
        detectorRef.current = await posedetection.createDetector(posedetection.SupportedModels.BlazePose, {
          runtime: "tfjs",
          modelType: "lite",
        })

        onReadyChange?.(true)

        const animate = async () => {
          if (!isMounted) return
          if (videoRef.current && detectorRef.current && modelRef.current) {
            const poses = await detectorRef.current.estimatePoses(videoRef.current, { flipHorizontal: true })
            if (poses[0]) {
              // Keypoints: left/right shoulders
              const kp = poses[0].keypoints
              const left = kp.find(k => k.name === "left_shoulder")
              const right = kp.find(k => k.name === "right_shoulder")
              const nose = kp.find(k => k.name === "nose")
              if (left && right && left.score! > 0.5 && right.score! > 0.5) {
                const midX = (left.x + right.x) / 2
                const midY = (left.y + right.y) / 2
                const dx = right.x - left.x
                const dy = right.y - left.y
                const angle = Math.atan2(dy, dx)

                // Map 2D video coords to simple normalized [-1,1] range
                const v = videoRef.current
                const nx = (midX / v.videoWidth) * 2 - 1
                const ny = -(midY / v.videoHeight) * 2 + 1

                // Position model in front of camera; simple mapping for demo
                const z = 0
                const x = nx
                const y = ny
                modelRef.current.position.set(x, y, z)
                modelRef.current.rotation.set(0, 0, angle)

                // Scale roughly to shoulder width
                const shoulderDist = Math.hypot(dx, dy) / v.videoWidth
                const s = Math.max(0.2, Math.min(1.5, shoulderDist * 2.2))
                modelRef.current.scale.setScalar(s)
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
      <div ref={containerRef} className="relative w-full aspect-video rounded-lg overflow-hidden bg-black" />
      <video ref={videoRef} className="hidden" playsInline muted />
      {error && (
        <div className="mt-2 text-sm text-red-400">{error}</div>
      )}
    </div>
  )
}


