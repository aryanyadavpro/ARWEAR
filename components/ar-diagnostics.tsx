"use client"

import { useState, useEffect } from 'react'

export default function ARDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    browser: '',
    device: '',
    protocol: '',
    cameraSupport: false,
    webxrSupport: false,
    modelViewerSupport: false,
    secureContext: false,
    permissions: 'unknown' as 'unknown' | 'granted' | 'denied' | 'prompt'
  })

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const runDiagnostics = async () => {
      // Browser detection
      const getBrowser = () => {
        const ua = navigator.userAgent
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
        if (ua.includes('Firefox')) return 'Firefox'
        if (ua.includes('Edg')) return 'Edge'
        return 'Unknown'
      }

      // Device detection
      const getDevice = () => {
        const ua = navigator.userAgent
        if (/iPad|iPhone|iPod/.test(ua)) return 'iOS'
        if (/Android/.test(ua)) return 'Android'
        if (/Windows/.test(ua)) return 'Windows'
        if (/Mac/.test(ua)) return 'macOS'
        return 'Unknown'
      }

      // Check camera support
      const checkCameraSupport = () => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      }

      // Check WebXR support
      const checkWebXRSupport = async () => {
        if ('xr' in navigator && 'XRSystem' in window) {
          try {
            const xr = (navigator as any).xr
            return await xr.isSessionSupported('immersive-ar')
          } catch {
            return false
          }
        }
        return false
      }

      // Check model-viewer support
      const checkModelViewerSupport = () => {
        return !!window.customElements.get('model-viewer')
      }

      // Check secure context
      const checkSecureContext = () => {
        return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      }

      // Check camera permissions
      const checkPermissions = async () => {
        if (navigator.permissions) {
          try {
            const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
            return permission.state
          } catch {
            return 'unknown'
          }
        }
        return 'unknown'
      }

      const webxrSupport = await checkWebXRSupport()
      const permissions = await checkPermissions()

      setDiagnostics({
        browser: getBrowser(),
        device: getDevice(),
        protocol: window.location.protocol,
        cameraSupport: checkCameraSupport(),
        webxrSupport,
        modelViewerSupport: checkModelViewerSupport(),
        secureContext: checkSecureContext(),
        permissions
      })
    }

    runDiagnostics()
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm border border-slate-600 shadow-lg"
      >
        🔍 AR Diagnostics
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">AR Try-On Diagnostics</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Browser:</span>
            <span className="text-white font-medium">{diagnostics.browser}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Device:</span>
            <span className="text-white font-medium">{diagnostics.device}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Protocol:</span>
            <span className={`font-medium ${diagnostics.secureContext ? 'text-green-400' : 'text-red-400'}`}>
              {diagnostics.protocol}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Secure Context:</span>
            <span className={`font-medium ${diagnostics.secureContext ? 'text-green-400' : 'text-red-400'}`}>
              {diagnostics.secureContext ? '✓ Yes' : '✗ No'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Camera Support:</span>
            <span className={`font-medium ${diagnostics.cameraSupport ? 'text-green-400' : 'text-red-400'}`}>
              {diagnostics.cameraSupport ? '✓ Yes' : '✗ No'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">WebXR AR:</span>
            <span className={`font-medium ${diagnostics.webxrSupport ? 'text-green-400' : 'text-yellow-400'}`}>
              {diagnostics.webxrSupport ? '✓ Supported' : '- Not Available'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Model Viewer:</span>
            <span className={`font-medium ${diagnostics.modelViewerSupport ? 'text-green-400' : 'text-yellow-400'}`}>
              {diagnostics.modelViewerSupport ? '✓ Loaded' : '- Loading...'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Camera Permission:</span>
            <span className={`font-medium ${
              diagnostics.permissions === 'granted' ? 'text-green-400' :
              diagnostics.permissions === 'denied' ? 'text-red-400' :
              diagnostics.permissions === 'prompt' ? 'text-yellow-400' :
              'text-slate-400'
            }`}>
              {diagnostics.permissions === 'granted' ? '✓ Granted' :
               diagnostics.permissions === 'denied' ? '✗ Denied' :
               diagnostics.permissions === 'prompt' ? '? Prompt' :
               '- Unknown'}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <h4 className="text-white font-medium mb-2">Recommendations:</h4>
          <div className="space-y-1 text-xs text-slate-300">
            {!diagnostics.secureContext && (
              <div className="text-red-300">
                • Use HTTPS or localhost for AR features
              </div>
            )}
            {!diagnostics.cameraSupport && (
              <div className="text-red-300">
                • Camera API not supported in this browser
              </div>
            )}
            {diagnostics.browser !== 'Chrome' && diagnostics.browser !== 'Safari' && (
              <div className="text-yellow-300">
                • Best AR support in Chrome or Safari
              </div>
            )}
            {diagnostics.permissions === 'denied' && (
              <div className="text-red-300">
                • Reset camera permissions in browser settings
              </div>
            )}
            {diagnostics.device === 'Unknown' && (
              <div className="text-yellow-300">
                • AR works best on mobile devices
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Reload Page
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}