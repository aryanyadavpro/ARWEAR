"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Camera, 
  Smartphone, 
  Globe, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench,
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react'

interface ARCapabilities {
  webxr: boolean
  sceneViewer: boolean
  quickLook: boolean
  modelViewer: boolean
  camera: boolean
  https: boolean
}

interface DeviceInfo {
  browser: string
  version: string
  device: string
  os: string
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isDesktop: boolean
  userAgent: string
}

interface ARDiagnostics {
  capabilities: ARCapabilities
  device: DeviceInfo
  recommendations: string[]
  issues: string[]
  score: number
}

export default function ARDiagnosticsComponent() {
  const [isClient, setIsClient] = useState(false)
  const [diagnostics, setDiagnostics] = useState<ARDiagnostics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')

  const [isOpen, setIsOpen] = useState(false)

  // Enhanced device detection
  const detectDevice = (): DeviceInfo => {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const isAndroid = /Android/i.test(ua)
    const isMobile = /Mobi|Android/i.test(ua) || isIOS
    const isDesktop = !isMobile

    // Browser detection with version
    let browser = 'Unknown'
    let version = '0'

    if (ua.includes('Chrome/')) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '0'
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browser = 'Safari'
      version = ua.match(/Version\/([0-9.]+)/)?.[1] || '0'
    } else if (ua.includes('Firefox/')) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '0'
    } else if (ua.includes('Edge/')) {
      browser = 'Edge'
      version = ua.match(/Edge\/([0-9.]+)/)?.[1] || '0'
    }

    // OS detection
    let os = 'Unknown'
    if (isIOS) {
      if (ua.includes('iPad')) os = 'iPadOS'
      else if (ua.includes('iPhone')) os = 'iOS'
      else os = 'iOS'
    } else if (isAndroid) {
      os = 'Android'
    } else if (ua.includes('Windows')) {
      os = 'Windows'
    } else if (ua.includes('Mac')) {
      os = 'macOS'
    } else if (ua.includes('Linux')) {
      os = 'Linux'
    }

    return {
      browser,
      version,
      device: isIOS ? 'iOS Device' : isAndroid ? 'Android Device' : 'Desktop',
      os,
      isIOS,
      isAndroid,
      isMobile,
      isDesktop,
      userAgent: ua
    }
  }

  // Check camera permission
  const checkCameraPermission = async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unknown'
    }

    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return permission.state
    } catch (error) {
      console.warn('Could not check camera permission:', error)
      return 'unknown'
    }
  }

  // Comprehensive AR capability detection
  const checkARCapabilities = async (device: DeviceInfo): Promise<ARCapabilities> => {
    const capabilities: ARCapabilities = {
      webxr: false,
      sceneViewer: false,
      quickLook: false,
      modelViewer: false,
      camera: false,
      https: false
    }

    // Check HTTPS
    capabilities.https = location.protocol === 'https:' || location.hostname === 'localhost'

    // Check WebXR
    if ('xr' in navigator && 'XRSystem' in window) {
      try {
        const xr = (navigator as any).xr
        capabilities.webxr = await xr.isSessionSupported('immersive-ar')
      } catch (error) {
        console.log('WebXR check failed:', error)
        capabilities.webxr = false
      }
    }

    // Check Scene Viewer (Android)
    capabilities.sceneViewer = device.isAndroid && 
                               device.browser === 'Chrome' && 
                               parseFloat(device.version) >= 79

    // Check Quick Look (iOS)
    capabilities.quickLook = device.isIOS && 
                            device.browser === 'Safari' && 
                            parseFloat(device.version) >= 12

    // Check Model Viewer support
    capabilities.modelViewer = 'customElements' in window && 
                              !!(window as any).customElements.get('model-viewer')

    // Check camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Test camera without actually requesting
        const devices = await navigator.mediaDevices.enumerateDevices()
        capabilities.camera = devices.some(device => device.kind === 'videoinput')
      } catch (error) {
        capabilities.camera = false
      }
    }

    return capabilities
  }

  // Generate recommendations and issues
  const analyzeResults = (capabilities: ARCapabilities, device: DeviceInfo): { recommendations: string[], issues: string[], score: number } => {
    const recommendations: string[] = []
    const issues: string[] = []
    let score = 0

    // Scoring and recommendations
    if (capabilities.https) {
      score += 20
    } else {
      issues.push('Not using HTTPS - required for AR features')
      recommendations.push('Access the site via HTTPS for AR functionality')
    }

    if (capabilities.camera) {
      score += 25
    } else {
      issues.push('Camera access not available')
      recommendations.push('Grant camera permissions for virtual try-on')
    }

    // Platform-specific recommendations
    if (device.isIOS) {
      if (capabilities.quickLook) {
        score += 30
        recommendations.push('✓ iOS AR Quick Look supported - great for AR placement')
      } else {
        issues.push('iOS Safari required for best AR experience')
        recommendations.push('Use Safari browser on iOS for AR features')
      }
    } else if (device.isAndroid) {
      if (capabilities.sceneViewer) {
        score += 30
        recommendations.push('✓ Android Scene Viewer supported - excellent for AR')
      } else {
        issues.push('Chrome browser required for Android AR')
        recommendations.push('Use Chrome browser on Android for AR features')
      }
    } else {
      // Desktop
      if (capabilities.webxr) {
        score += 25
        recommendations.push('✓ WebXR supported - advanced AR capabilities available')
      } else {
        issues.push('Limited AR support on desktop')
        recommendations.push('Use a mobile device for the best AR experience')
      }
    }

    if (capabilities.modelViewer) {
      score += 15
      recommendations.push('✓ 3D model viewer fully supported')
    } else {
      recommendations.push('3D models will load via fallback method')
    }

    // General recommendations
    if (device.isMobile) {
      recommendations.push('Hold device steady for better AR tracking')
      recommendations.push('Ensure good lighting for optimal results')
    }

    if (score >= 80) {
      recommendations.unshift('🎉 Excellent AR support! All features should work perfectly')
    } else if (score >= 60) {
      recommendations.unshift('👍 Good AR support! Most features will work well')
    } else if (score >= 40) {
      recommendations.unshift('⚠️ Limited AR support. Some features may not work')
    } else {
      recommendations.unshift('❌ Poor AR support. Consider using a different device/browser')
    }

    return { recommendations, issues, score }
  }

  // Run full diagnostic
  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const device = detectDevice()
      const capabilities = await checkARCapabilities(device)
      const permission = await checkCameraPermission()
      const analysis = analyzeResults(capabilities, device)

      setCameraPermission(permission)
      setDiagnostics({
        capabilities,
        device,
        ...analysis
      })
    } catch (error) {
      console.error('Diagnostics failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Run diagnostics when component mounts
  useEffect(() => {
    setIsClient(true)
    if (isOpen && !diagnostics) {
      runDiagnostics()
    }
  }, [isOpen, diagnostics])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getCapabilityIcon = (supported: boolean) => {
    return supported ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    )
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 shadow-lg z-50"
      >
        <Wrench className="w-4 h-4 mr-2" />
        AR Diagnostics
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto text-slate-200">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            AR Compatibility Diagnostics
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-slate-300">Running comprehensive AR diagnostics...</p>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className={`text-4xl font-bold ${getScoreColor(diagnostics.score)}`}>
                  {diagnostics.score}/100
                </div>
                <div className="text-slate-300 text-sm mt-1">AR Compatibility Score</div>
              </div>

              {/* Device Information */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  Device Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Device:</span>
                    <span className="ml-2 font-medium text-slate-200">{diagnostics.device.device}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">OS:</span>
                    <span className="ml-2 font-medium text-slate-200">{diagnostics.device.os}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Browser:</span>
                    <span className="ml-2 font-medium text-slate-200">
                      {diagnostics.device.browser} {diagnostics.device.version}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Type:</span>
                    <Badge variant={diagnostics.device.isMobile ? "default" : "secondary"} className="ml-2">
                      {diagnostics.device.isMobile ? "Mobile" : "Desktop"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* AR Capabilities */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  AR Capabilities
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      HTTPS Security
                    </span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.https)}
                      <span className="text-sm font-medium">
                        {diagnostics.capabilities.https ? 'Secure' : 'Required'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Camera Access
                    </span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.camera)}
                      <span className="text-sm font-medium">
                        {cameraPermission === 'granted' ? 'Granted' :
                         cameraPermission === 'denied' ? 'Denied' :
                         cameraPermission === 'prompt' ? 'Pending' : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300">WebXR Support</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.webxr)}
                      <span className="text-sm font-medium">
                        {diagnostics.capabilities.webxr ? 'Available' : 'Not supported'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300">Scene Viewer (Android)</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.sceneViewer)}
                      <span className="text-sm font-medium">
                        {diagnostics.capabilities.sceneViewer ? 'Available' : 'Not Android/Chrome'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300">Quick Look (iOS)</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.quickLook)}
                      <span className="text-sm font-medium">
                        {diagnostics.capabilities.quickLook ? 'Available' : 'Not iOS/Safari'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <span className="text-slate-300">3D Model Viewer</span>
                    <div className="flex items-center gap-2">
                      {getCapabilityIcon(diagnostics.capabilities.modelViewer)}
                      <span className="text-sm font-medium">
                        {diagnostics.capabilities.modelViewer ? 'Loaded' : 'Fallback mode'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues */}
              {diagnostics.issues.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Issues Found
                  </h4>
                  <div className="space-y-2">
                    {diagnostics.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-red-300 text-sm">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {diagnostics.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-300 text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-700">
            <Button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Re-run Diagnostics
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
