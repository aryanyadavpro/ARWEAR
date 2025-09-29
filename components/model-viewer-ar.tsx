// @ts-nocheck
"use client"

import { useRef } from "react"
import "@google/model-viewer"
import type { ModelViewerElement } from "@google/model-viewer"

type Props = {
  glbUrl: string
  poster: string
  alt: string
}

export default function ModelViewerAR({ glbUrl, poster, alt }: Props) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

  const handleScale = (factor: "increase" | "decrease") => {
    if (!viewerRef.current) return
    const currentScale = parseFloat(viewerRef.current.scale.split(" ")[0])
    const nextScale =
      factor === "increase"
        ? Math.min(0.6, currentScale + 0.05)
        : Math.max(0.05, currentScale - 0.05)
    viewerRef.current.scale = `${nextScale} ${nextScale} ${nextScale}`
  }

  const handleRotate = () => {
    if (!viewerRef.current) return
    const currentOrbit = viewerRef.current.cameraOrbit
    const [theta, phi, radius] = currentOrbit.split(" ")
    const nextTheta = parseFloat(theta) + 15
    viewerRef.current.cameraOrbit = `${nextTheta}deg ${phi} ${radius}`
  }

  const activateAR = async () => {
    if (!viewerRef.current) return

    try {
      // Check for HTTPS or localhost (required for AR)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('AR requires HTTPS or localhost')
      }

      // Prefer Android Scene Viewer when on Android
      if (isAndroid && viewerRef.current?.canActivateAR) {
        await viewerRef.current.activateAR()
        return
      }

      // Check WebXR support first (for browsers with WebXR AR)
      if ('xr' in navigator && 'XRSystem' in window && !isAndroid) {
        const xr = navigator.xr as any
        const isSupported = await xr.isSessionSupported('immersive-ar')
        if (!isSupported) {
          throw new Error('WebXR AR not supported')
        }
      }

      // Check model-viewer AR capability
      if (!viewerRef.current.canActivateAR) {
        throw new Error('Model viewer AR not available')
      }
      
      // Attempt to activate AR (will route to Scene Viewer on Android or WebXR/Quick Look otherwise)
      await viewerRef.current.activateAR()
      
    } catch (error: any) {
      console.error("AR activation failed:", error)
      
      let errorMessage = "AR is not available. "
      let instructions = []
      
      // Specific error handling
      if (error.message?.includes('not supported') || error.message?.includes('WebXR')) {
        errorMessage = "AR is not supported on this device or browser."
        instructions = [
          "• Use a mobile device (iPhone/iPad or Android)",
          "• On iOS: Use Safari browser",
          "• On Android: Use Chrome browser",
          "• Make sure your device supports ARCore (Android) or ARKit (iOS)"
        ]
      } else if (error.message?.includes('permission')) {
        errorMessage = "Camera permission is required for AR."
        instructions = [
          "• Allow camera access when prompted",
          "• Check browser settings for camera permissions",
          "• Try refreshing the page and allow camera access"
        ]
      } else if (error.message?.includes('secure context')) {
        errorMessage = "AR requires a secure connection."
        instructions = [
          "• Make sure you're using HTTPS",
          "• Try accessing via localhost for development"
        ]
      } else {
        errorMessage = "AR session could not start."
        instructions = [
          "• Make sure you're on a compatible device",
          "• Try closing other camera apps",
          "• Restart your browser and try again"
        ]
      }
      
      // Create a more user-friendly error display
      const fullMessage = `${errorMessage}\n\nTroubleshooting:\n${instructions.join('\n')}`
      if (isAndroid) {
        // Fallback to Android Scene Viewer intent if available
        const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(location.href)};end;`
        try {
          location.href = intentUrl
          return
        } catch {}
      }
      alert(fullMessage)
    }
  }

  return (
    <div className="w-full">
      <model-viewer
        ref={viewerRef}
        src={glbUrl}
        poster={poster}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="floor"
        ar-scale="0.1 0.1 0.1"
        ar-persist="true"
        camera-controls
        camera-orbit="0deg 75deg 105%"
        touch-action="pan-y"
        exposure="1"
        auto-rotate
        auto-rotate-delay={3000}
        interaction-policy="allow-when-focused"
        loading="eager"
        reveal="auto"
        scale="0.1 0.1 0.1"
        style={{
          width: "100%",
          height: "420px",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      ></model-viewer>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="px-3 py-1 rounded-md border"
          onClick={() => handleScale("decrease")}
          aria-label="Decrease scale"
        >
          −
        </button>
        <span className="text-sm font-medium">Scale</span>
        <button
          className="px-3 py-1 rounded-md border"
          onClick={() => handleScale("increase")}
          aria-label="Increase scale"
        >
          +
        </button>

        <button
          className="ml-auto px-3 py-1 rounded-md border"
          onClick={handleRotate}
          aria-label="Rotate 15 degrees"
        >
          Rotate
        </button>

        {/* Removed "View in your space" button */}
      </div>

      {/* AR Instructions */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          AR Viewing Instructions:
        </h4>
        <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
          <li>Click "View in your space" to place the model in your environment</li>
          <li>Scan your floor and tap to place the object (model will be smaller and fixed)</li>
          <li>Walk around and interact with the 3D model - it stays in place</li>
          <li>Use pinch gestures to scale, drag to rotate the model</li>
          <li>Works best on mobile devices with AR support</li>
          <li>Adjust scale and rotation before entering AR mode for best results</li>
        </ul>
      </div>
    </div>
  )
}