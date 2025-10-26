// @ts-nocheck
"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

// Declare model-viewer as a custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}

type Props = {
  glbUrl: string
  poster: string
  alt: string
}

export default function ModelViewerAR({ glbUrl, poster, alt }: Props) {
  const viewerRef = useRef<any>(null)
  const [isModelViewerLoaded, setIsModelViewerLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  
  // Interactive controls state
  const [scale, setScale] = useState(1.0)
  const [rotationY, setRotationY] = useState(0)
  const [cameraOrbitTheta, setCameraOrbitTheta] = useState(0)
  const [cameraOrbitPhi, setCameraOrbitPhi] = useState(75)
  const [cameraDistance, setCameraDistance] = useState(105)
  
  useEffect(() => {
    setIsClient(true)
    const ua = navigator.userAgent
    setIsAndroid(/Android/i.test(ua))
    setIsIOS(/iPad|iPhone|iPod/.test(ua))
    
    const loadModelViewer = async () => {
      // Load the web component from the installed package (no CDN)
      if (!(window.customElements && window.customElements.get('model-viewer'))) {
        try {
          await import('@google/model-viewer/dist/model-viewer.min.js')
        } catch (e) {
          console.error('Failed to import @google/model-viewer', e)
          return
        }
      }
      setIsModelViewerLoaded(true)
    }
    
    loadModelViewer()
  }, [])

  // Update model scale
  const updateScale = (newScale: number) => {
    if (!viewerRef.current) return
    setScale(newScale)
    viewerRef.current.scale = `${newScale} ${newScale} ${newScale}`
  }

  // Update camera orbit (rotation around model)
  const updateCameraOrbit = (theta: number, phi: number, distance: number) => {
    if (!viewerRef.current) return
    setCameraOrbitTheta(theta)
    setCameraOrbitPhi(phi)
    setCameraDistance(distance)
    viewerRef.current.cameraOrbit = `${theta}deg ${phi}deg ${distance}%`
  }
  
  // Reset to default view
  const resetView = () => {
    setScale(1.0)
    setCameraOrbitTheta(0)
    setCameraOrbitPhi(75)
    setCameraDistance(105)
    if (viewerRef.current) {
      viewerRef.current.scale = "1 1 1"
      viewerRef.current.cameraOrbit = "0deg 75deg 105%"
    }
  }

  const activateAR = async () => {
    if (!viewerRef.current) return

    try {
      // Check for secure context (required for AR)
      if (!window.isSecureContext) {
        throw new Error('AR requires a secure context (HTTPS)')
      }

      // Force enable AR attributes
      viewerRef.current.setAttribute('ar', '')
      viewerRef.current.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
      viewerRef.current.setAttribute('ar-placement', 'floor')
      viewerRef.current.setAttribute('ar-scale', 'auto')
      
      // Wait for attributes to be processed
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check mobile platform and prefer appropriate AR mode
      if (isAndroid) {
        // Android: Try Scene Viewer first with ABSOLUTE HTTPS URL (required)
        const absoluteGlbUrl = new URL(glbUrl, window.location.origin).href
        const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(absoluteGlbUrl)}&mode=ar_only&resizable=false#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`
        
        try {
          // Try model-viewer AR activation first (auto-resolves to Scene Viewer)
          if (viewerRef.current.canActivateAR) {
            await viewerRef.current.activateAR()
            return
          } else {
            // Fallback to direct Scene Viewer intent
            window.location.href = sceneViewerUrl
            return
          }
        } catch (sceneViewerError) {
          // If Scene Viewer fails, try WebXR
          console.log('Scene Viewer failed, trying WebXR:', sceneViewerError)
        }
      }

      // iOS or WebXR fallback
      if (viewerRef.current.canActivateAR) {
        await viewerRef.current.activateAR()
        return
      }

      // Final fallback for iOS Quick Look
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const quickLookUrl = `${glbUrl}#allowsContentScaling=0`
        const a = document.createElement('a')
        a.href = quickLookUrl
        a.rel = 'ar'
        a.click()
        return
      }

      throw new Error('AR not supported on this device')
      
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

  if (!isModelViewerLoaded) {
    return (
      <div className="w-full">
        <div className="w-full h-[420px] bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300 font-medium">Loading 3D AR Viewer...</p>
            <p className="text-slate-400 text-sm mt-1">Preparing AR experience</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <model-viewer
        ref={viewerRef}
        src={glbUrl && glbUrl.trim() !== '' ? glbUrl : 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}
        poster={poster}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-placement="wall"
        ar-scale="auto"
        camera-controls
        camera-orbit="0deg 75deg 105%"
        touch-action="manipulation"
        exposure="1.0"
        auto-rotate
        auto-rotate-delay={3000}
        interaction-policy="allow-when-focused"
        loading="eager"
        reveal="auto"
        scale="1 1 1"
        shadow-intensity="0.8"
        shadow-softness="0.3"
        environment-image="neutral"
        quick-look-browsers="safari chrome firefox"
        ar-hit-test="false"
        onError={(e: any) => {
          console.error('Model Viewer Error:', e)
        }}
        onLoad={() => {
          console.log('Model loaded successfully')
          // Enable AR capability check
          setTimeout(() => {
            if (viewerRef.current) {
              console.log('AR support:', viewerRef.current.canActivateAR)
            }
          }, 1000)
        }}
        style={{
          width: "100%",
          height: "420px",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#f8f9fa",
        }}
      >
        {/* Custom AR Button (hide on iOS without USDZ) */}
        {!isIOS ? (
          <button 
            slot="ar-button"
            onClick={activateAR}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors font-medium"
          >
            📱 View in AR
          </button>
        ) : (
          <div slot="ar-button" className="absolute bottom-4 right-4 bg-slate-700 text-white/80 px-3 py-2 rounded-lg text-xs border border-slate-600">
            iOS AR requires USDZ; 3D preview available
          </div>
        )}
        
        {/* Progress indicator */}
        <div slot="progress-bar" className="bg-blue-600 h-1"></div>
      </model-viewer>

      {/* Advanced Interactive Controls */}
      <div className="mt-4 bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-200">3D Model Controls</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
          >
            Reset View
          </Button>
        </div>
        
        {/* Scale Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Scale</label>
            <span className="text-xs text-slate-400">{scale.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 h-8 w-8 p-0"
              onClick={() => updateScale(Math.max(0.1, scale - 0.1))}
            >
              −
            </Button>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => updateScale(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 h-8 w-8 p-0"
              onClick={() => updateScale(Math.min(3, scale + 0.1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Horizontal Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Horizontal Rotation</label>
            <span className="text-xs text-slate-400">{cameraOrbitTheta}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={cameraOrbitTheta}
            onChange={(e) => updateCameraOrbit(parseInt(e.target.value), cameraOrbitPhi, cameraDistance)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Vertical Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Vertical Angle</label>
            <span className="text-xs text-slate-400">{cameraOrbitPhi}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={cameraOrbitPhi}
            onChange={(e) => updateCameraOrbit(cameraOrbitTheta, parseInt(e.target.value), cameraDistance)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Distance/Zoom */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Distance</label>
            <span className="text-xs text-slate-400">{cameraDistance}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={cameraDistance}
            onChange={(e) => updateCameraOrbit(cameraOrbitTheta, cameraOrbitPhi, parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* AR Instructions */}
      <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700 rounded-md">
        <h4 className="text-sm font-medium text-slate-100 mb-1">
          💡 Quick Tips:
        </h4>
        <ul className="text-xs text-slate-300 space-y-1">
          <li>• Drag on the model to rotate it freely</li>
          <li>• Use sliders above for precise control</li>
          <li>• Pinch to zoom or use the distance slider</li>
          <li>• Click "View in AR" button on mobile for immersive AR</li>
        </ul>
      </div>

      <style jsx global>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #f8f9fa;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #f8f9fa;
        }
        .slider::-webkit-slider-thumb:hover {
          background: #7c3aed;
        }
        .slider::-moz-range-thumb:hover {
          background: #7c3aed;
        }
      `}</style>
    </div>
  )
}