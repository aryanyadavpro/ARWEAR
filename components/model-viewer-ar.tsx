// @ts-nocheck
"use client"

import { useRef } from "react"
import "@google/model-viewer"
import type { ModelViewerElement } from "@google/model-viewer"
import { Button } from "@/components/ui/button"

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
            onClick={() => handleScale("decrease")}
            aria-label="Decrease scale"
          >
            −
          </Button>
          <span className="text-sm font-medium text-slate-300">Scale</span>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
            onClick={() => handleScale("increase")}
            aria-label="Increase scale"
          >
            +
          </Button>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
            onClick={handleRotate}
            aria-label="Rotate 15 degrees"
          >
            Rotate
          </Button>
        </div>
      </div>

      {/* AR Instructions */}
      <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700 rounded-md">
        <h4 className="text-sm font-medium text-slate-100 mb-1">
          AR Viewing Instructions:
        </h4>
        <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
          <li>Use the Scale and Rotate controls to adjust the model</li>
          <li>Ensure good lighting and keep your upper body in frame</li>
          <li>On mobile, use a stable posture for smoother tracking</li>
          <li>For AR-in-space, try the built-in AR button on supported devices</li>
        </ul>
      </div>
    </div>
  )
}