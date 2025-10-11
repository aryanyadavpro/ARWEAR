"use client"

import { useEffect, useState } from 'react'

interface ARSetupProps {
  onReady: (ready: boolean) => void
}

export default function ARSetup({ onReady }: ARSetupProps) {
  const [status, setStatus] = useState<string>('Initializing AR components...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const setupAR = async () => {
      try {
        setStatus('Checking secure context...')
        setProgress(10)
        
        // Check secure context
        if (!window.isSecureContext) {
          throw new Error('AR requires HTTPS (secure context)')
        }
        
        setStatus('Loading Model Viewer library...')
        setProgress(30)
        
        // Load model-viewer if not already loaded
        if (!window.customElements || !window.customElements.get('model-viewer')) {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/@google/model-viewer@v3.3.0/dist/model-viewer.min.js'
          script.type = 'module'
          script.crossOrigin = 'anonymous'
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load Model Viewer'))
            document.head.appendChild(script)
          })
          
          // Wait for custom element to register
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        setStatus('Checking camera availability...')
        setProgress(60)
        
        // Check camera support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            // Quick camera access test (will be released immediately)
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'user' },
              audio: false 
            })
            stream.getTracks().forEach(track => track.stop())
          } catch (e) {
            console.warn('Camera test failed:', e)
            // Don't fail setup for camera issues, just warn
          }
        }
        
        setStatus('Checking WebXR support...')
        setProgress(80)
        
        // Check WebXR
        if ('xr' in navigator && 'XRSystem' in window) {
          try {
            const xr = (navigator as any).xr
            await xr.isSessionSupported('immersive-ar')
          } catch (e) {
            console.log('WebXR not supported:', e)
          }
        }
        
        setStatus('AR components ready!')
        setProgress(100)
        
        setTimeout(() => {
          onReady(true)
        }, 500)
        
      } catch (error: any) {
        console.error('AR setup failed:', error)
        setStatus(`AR setup failed: ${error.message}`)
        onReady(false)
      }
    }
    
    setupAR()
  }, [onReady])
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Setting up AR Experience</h3>
          
          <p className="text-slate-300 text-sm mb-4">{status}</p>
          
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-slate-400">
            Preparing cameras, 3D models, and AR features...
          </div>
        </div>
      </div>
    </div>
  )
}