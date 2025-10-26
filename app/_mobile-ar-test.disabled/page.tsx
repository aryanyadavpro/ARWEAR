"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, CheckCircle, XCircle, AlertCircle, Smartphone } from 'lucide-react'
import dynamic from 'next/dynamic'

const MobileARTryon = dynamic(() => import('@/components/mobile-ar-tryon'), { ssr: false })

export default function MobileARTestPage() {
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    isIOS: false,
    isAndroid: false,
    browser: '',
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 0,
    isSecure: false,
    hasCamera: false,
    hasWebGL: false,
    hasTensorFlow: false
  })

  const [testResults, setTestResults] = useState({
    cameraAccess: 'untested',
    arSupport: 'untested',
    webglSupport: 'untested',
    tensorflowSupport: 'untested'
  })

  const [currentTest, setCurrentTest] = useState<string | null>(null)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const browser = isIOS && /Safari/.test(userAgent) && !/Chrome/.test(userAgent) ? 'Safari' :
                   isAndroid && /Chrome/.test(userAgent) ? 'Chrome' :
                   /Chrome/.test(userAgent) ? 'Chrome' :
                   /Safari/.test(userAgent) ? 'Safari' :
                   /Firefox/.test(userAgent) ? 'Firefox' : 'Other'

    setDeviceInfo({
      userAgent,
      isIOS,
      isAndroid,
      browser,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      isSecure: window.isSecureContext,
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasWebGL: !!document.createElement('canvas').getContext('webgl'),
      hasTensorFlow: typeof window !== 'undefined'
    })
  }, [])

  const testCameraAccess = async () => {
    setCurrentTest('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      stream.getTracks().forEach(track => track.stop())
      setTestResults(prev => ({ ...prev, cameraAccess: 'success' }))
    } catch (error) {
      console.error('Camera test failed:', error)
      setTestResults(prev => ({ ...prev, cameraAccess: 'failed' }))
    } finally {
      setCurrentTest(null)
    }
  }

  const testARSupport = async () => {
    setCurrentTest('ar')
    try {
      let supported = false
      
      if ('xr' in navigator && 'XRSystem' in window) {
        const xr = (navigator as any).xr
        supported = await xr.isSessionSupported('immersive-ar')
      }
      
      if (!supported) {
        // Check for Scene Viewer (Android) or Quick Look (iOS)
        supported = deviceInfo.isAndroid || deviceInfo.isIOS
      }
      
      setTestResults(prev => ({ 
        ...prev, 
        arSupport: supported ? 'success' : 'failed' 
      }))
    } catch (error) {
      console.error('AR test failed:', error)
      setTestResults(prev => ({ ...prev, arSupport: 'failed' }))
    } finally {
      setCurrentTest(null)
    }
  }

  const testWebGL = () => {
    setCurrentTest('webgl')
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const supported = !!gl
      setTestResults(prev => ({ 
        ...prev, 
        webglSupport: supported ? 'success' : 'failed' 
      }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, webglSupport: 'failed' }))
    } finally {
      setCurrentTest(null)
    }
  }

  const testTensorFlow = async () => {
    setCurrentTest('tensorflow')
    try {
      const tf = await import('@tensorflow/tfjs-core')
      await tf.ready()
      setTestResults(prev => ({ ...prev, tensorflowSupport: 'success' }))
    } catch (error) {
      console.error('TensorFlow test failed:', error)
      setTestResults(prev => ({ ...prev, tensorflowSupport: 'failed' }))
    } finally {
      setCurrentTest(null)
    }
  }

  const runAllTests = async () => {
    await testCameraAccess()
    await testARSupport()
    testWebGL()
    await testTensorFlow()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      case 'untested': return <AlertCircle className="w-5 h-5 text-gray-400" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">📱 Mobile AR Diagnostics</h1>
          <p className="text-slate-400">Test your device's compatibility with AR features</p>
        </div>

        {/* Device Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Device Type:</span>
                <span className="text-slate-200 font-medium">
                  {deviceInfo.isIOS ? 'iOS Device' : 
                   deviceInfo.isAndroid ? 'Android Device' : 'Desktop/Other'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Browser:</span>
                <span className="text-slate-200 font-medium">{deviceInfo.browser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Screen Size:</span>
                <span className="text-slate-200 font-medium">
                  {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pixel Ratio:</span>
                <span className="text-slate-200 font-medium">{deviceInfo.devicePixelRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Secure Context:</span>
                <span className={`font-medium ${deviceInfo.isSecure ? 'text-green-400' : 'text-red-400'}`}>
                  {deviceInfo.isSecure ? 'Yes (HTTPS)' : 'No (HTTP)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Camera API:</span>
                <span className={`font-medium ${deviceInfo.hasCamera ? 'text-green-400' : 'text-red-400'}`}>
                  {deviceInfo.hasCamera ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compatibility Tests */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Compatibility Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Camera Access Test */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Camera Access</h3>
                  <p className="text-slate-400 text-sm">Front camera permission</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.cameraAccess)}
                  <Button
                    onClick={testCameraAccess}
                    disabled={currentTest === 'camera'}
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                  >
                    {currentTest === 'camera' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              {/* AR Support Test */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">AR Support</h3>
                  <p className="text-slate-400 text-sm">WebXR, Scene Viewer, Quick Look</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.arSupport)}
                  <Button
                    onClick={testARSupport}
                    disabled={currentTest === 'ar'}
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                  >
                    {currentTest === 'ar' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              {/* WebGL Test */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">WebGL Support</h3>
                  <p className="text-slate-400 text-sm">3D graphics rendering</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.webglSupport)}
                  <Button
                    onClick={testWebGL}
                    disabled={currentTest === 'webgl'}
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                  >
                    {currentTest === 'webgl' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>

              {/* TensorFlow Test */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">TensorFlow.js</h3>
                  <p className="text-slate-400 text-sm">AI pose detection</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.tensorflowSupport)}
                  <Button
                    onClick={testTensorFlow}
                    disabled={currentTest === 'tensorflow'}
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                  >
                    {currentTest === 'tensorflow' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={runAllTests}
                disabled={!!currentTest}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentTest ? 'Running Tests...' : 'Run All Tests'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {!deviceInfo.isSecure && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Secure Connection Required</p>
                    <p className="text-red-200">AR features require HTTPS. Please use a secure connection.</p>
                  </div>
                </div>
              )}
              
              {!deviceInfo.isIOS && !deviceInfo.isAndroid && (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
                  <div>
                    <p className="text-orange-300 font-medium">Mobile Device Recommended</p>
                    <p className="text-orange-200">AR works best on mobile devices with cameras.</p>
                  </div>
                </div>
              )}

              {deviceInfo.isIOS && deviceInfo.browser !== 'Safari' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">Safari Recommended for iOS</p>
                    <p className="text-yellow-200">For best AR support on iOS, use Safari browser.</p>
                  </div>
                </div>
              )}

              {deviceInfo.isAndroid && deviceInfo.browser !== 'Chrome' && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">Chrome Recommended for Android</p>
                    <p className="text-yellow-200">For best AR support on Android, use Chrome browser.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live AR Test */}
        {(deviceInfo.isIOS || deviceInfo.isAndroid) && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🧪 Live AR Test</CardTitle>
            </CardHeader>
            <CardContent>
              <MobileARTryon
                modelUrl="/baggy_pants_free.glb"
                className="w-full"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}