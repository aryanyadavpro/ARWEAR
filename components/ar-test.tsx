"use client"

import { useEffect, useState } from "react"

export default function ARTest() {
  const [arSupport, setArSupport] = useState<{
    webxr: boolean
    sceneViewer: boolean
    quickLook: boolean
    overall: boolean
  }>({
    webxr: false,
    sceneViewer: false,
    quickLook: false,
    overall: false
  })

  useEffect(() => {
    const checkARSupport = async () => {
      // Check WebXR support with session capability
      let webxrSupported = false
      if ('xr' in navigator && 'XRSystem' in window) {
        try {
          const xr = navigator.xr as any
          webxrSupported = await xr.isSessionSupported('immersive-ar')
        } catch (error) {
          console.log('WebXR check failed:', error)
          webxrSupported = false
        }
      }
      
      // Check Scene Viewer (Android) - more specific check
      const isAndroid = /Android/i.test(navigator.userAgent)
      const isChrome = /Chrome/i.test(navigator.userAgent)
      const sceneViewerSupported = isAndroid && isChrome
      
      // Check Quick Look (iOS) - more specific check
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
      const quickLookSupported = isIOS && isSafari
      
      // Overall AR support
      const overallSupported = webxrSupported || sceneViewerSupported || quickLookSupported

      setArSupport({
        webxr: webxrSupported,
        sceneViewer: sceneViewerSupported,
        quickLook: quickLookSupported,
        overall: overallSupported
      })
    }

    checkARSupport()
  }, [])

  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const getDeviceInfo = () => {
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) return 'iOS'
    if (/Android/.test(ua)) return 'Android'
    if (/Windows/.test(ua)) return 'Windows'
    if (/Mac/.test(ua)) return 'macOS'
    return 'Unknown'
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-3">AR Compatibility Check</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Device:</span>
          <span className="font-medium">{getDeviceInfo()}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Browser:</span>
          <span className="font-medium">{getBrowserInfo()}</span>
        </div>
        
        <hr className="my-3" />
        
        <div className="flex justify-between">
          <span>WebXR Support:</span>
          <span className={arSupport.webxr ? "text-green-600 font-medium" : "text-red-600"}>
            {arSupport.webxr ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Scene Viewer (Android):</span>
          <span className={arSupport.sceneViewer ? "text-green-600 font-medium" : "text-gray-500"}>
            {arSupport.sceneViewer ? "✓ Available" : "- Not Android"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Quick Look (iOS):</span>
          <span className={arSupport.quickLook ? "text-green-600 font-medium" : "text-gray-500"}>
            {arSupport.quickLook ? "✓ Available" : "- Not iOS"}
          </span>
        </div>
        
        <hr className="my-3" />
        
        <div className="flex justify-between">
          <span><strong>Overall AR Support:</strong></span>
          <span className={arSupport.overall ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {arSupport.overall ? "✓ Supported" : "✗ Not Supported"}
          </span>
        </div>
      </div>
      
      {!arSupport.overall && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>For best AR experience:</strong><br/>
          • Use mobile device (iOS or Android)<br/>
          • iOS: Use Safari browser<br/>
          • Android: Use Chrome browser
        </div>
      )}
    </div>
  )
}