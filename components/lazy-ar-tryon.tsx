"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface LazyARTryOnProps {
  modelUrl: string
  tryOnMode: 'regular' | 'advanced' | 'mobile'
  onClose?: () => void
}

export default function LazyARTryOn({ modelUrl, tryOnMode, onClose }: LazyARTryOnProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ARComponent, setARComponent] = useState<any>(null)

  const loadAndActivate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check camera permissions first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser')
      }

      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Stop the stream immediately, we just wanted to check permission
          stream.getTracks().forEach(track => track.stop())
        })

      // Load AR component based on mode - all use MoveNet for compatibility
      const module = await import('@/components/simple-ar-tryon')
      const component = module.default
      
      // Note: All modes currently use the same underlying component
      // Different visualizations can be added later

      setARComponent(() => component)
      setIsActive(true)
    } catch (err: any) {
      console.error('Failed to load AR component:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('📷 Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('📷 No camera found on this device.')
      } else {
        setError(`❌ Failed to activate AR: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setError(null)
              setIsActive(false)
            }}
            variant="outline"
            className="border-slate-600"
          >
            Try Again
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="ghost">
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-300 mb-2">Loading AR Experience...</p>
        <p className="text-slate-400 text-sm">Initializing camera and AI models</p>
      </div>
    )
  }

  if (isActive && ARComponent) {
    return <ARComponent modelUrl={modelUrl} className="w-full" />
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 text-center border border-slate-700">
      <div className="mb-6">
        <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">📸</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Ready for Virtual Try-On?</h3>
        <p className="text-slate-300 mb-4">
          {tryOnMode === 'mobile' 
            ? '📱 Mobile-optimized AR with front camera and touch controls'
            : tryOnMode === 'regular'
            ? '🎯 Smart AR experience with intelligent body tracking'
            : '🧠 Advanced computer vision with body segmentation'}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={loadAndActivate}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
        >
          🚀 Activate Camera & Start Try-On
        </Button>

        <div className="bg-slate-900/50 rounded-lg p-4 text-left">
          <p className="text-xs text-slate-400 mb-2">ℹ️ What happens next:</p>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Your browser will request camera permission</li>
            <li>• AI models will load (may take a few seconds)</li>
            <li>• All processing happens locally on your device</li>
            <li>• No images are uploaded or stored</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
