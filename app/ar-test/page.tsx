"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ARModelSelector from '@/components/ar-model-selector'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ARTestPage() {
  const [mode, setMode] = useState<'viewer' | 'tryon'>('viewer')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 text-slate-300 hover:text-white">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-3">AR Test Lab</h1>
          <p className="text-slate-300 text-lg">
            Test your uploaded 3D models with AR viewing and virtual try-on
          </p>
        </div>

        {/* Mode Selector */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'viewer' | 'tryon')} className="mb-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="viewer" className="data-[state=active]:bg-violet-600">
              AR Viewer
            </TabsTrigger>
            <TabsTrigger value="tryon" className="data-[state=active]:bg-violet-600">
              Virtual Try-On
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="viewer" className="mt-0">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">AR Viewer Mode</h2>
                <p className="text-slate-400 text-sm">
                  View 3D models in augmented reality. Place them in your space and interact with them.
                  Works best on mobile devices with AR support (ARCore/ARKit).
                </p>
              </div>
              <ARModelSelector mode="viewer" category="clothing" />
            </TabsContent>

            <TabsContent value="tryon" className="mt-0">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">Virtual Try-On Mode</h2>
                <p className="text-slate-400 text-sm">
                  Try on clothing virtually using your camera. The system detects your body pose and
                  overlays the 3D model. Allow camera access when prompted.
                </p>
              </div>
              <ARModelSelector mode="tryon" category="clothing" />
            </TabsContent>
          </div>
        </Tabs>

        {/* Instructions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-violet-400 font-medium mb-2">1. Upload Models</h4>
              <p className="text-slate-400 text-sm">
                Go to the <Link href="/admin" className="text-violet-400 hover:underline">admin panel</Link> and
                upload your 3D models (GLB, GLTF, or USDZ format).
              </p>
            </div>
            <div>
              <h4 className="text-violet-400 font-medium mb-2">2. Select Model</h4>
              <p className="text-slate-400 text-sm">
                Choose a model from the dropdown menu. The model will be fetched from MongoDB.
              </p>
            </div>
            <div>
              <h4 className="text-violet-400 font-medium mb-2">3. AR Viewer</h4>
              <p className="text-slate-400 text-sm">
                Click "View in AR" to place the model in your real environment using your device's camera.
              </p>
            </div>
            <div>
              <h4 className="text-violet-400 font-medium mb-2">4. Virtual Try-On</h4>
              <p className="text-slate-400 text-sm">
                Allow camera access and stand in view. The system will detect your body and overlay the clothing.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Technical Details</h4>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• 3D models are stored in MongoDB with metadata</li>
            <li>• Files are served as base64-encoded data and converted to Blob URLs</li>
            <li>• AR Viewer uses Google's model-viewer for cross-platform AR support</li>
            <li>• Virtual Try-On uses TensorFlow.js BlazePose for body detection</li>
            <li>• Maximum model size: 50MB per file</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
