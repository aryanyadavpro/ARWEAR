"use client"

import { useState, useEffect } from 'react'
import { use3DModels, use3DModel, base64ToObjectURL, type Model3D } from '@/hooks/use-3d-models'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import ModelViewerAR from './model-viewer-ar'
import ARVirtualTryon from './ar-virtual-tryon'

interface ARModelSelectorProps {
  category?: string
  mode?: 'viewer' | 'tryon'
  className?: string
}

export default function ARModelSelector({ category, mode = 'viewer', className = '' }: ARModelSelectorProps) {
  const { models, loading: modelsLoading, error: modelsError } = use3DModels(category)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const { model, loading: modelLoading } = use3DModel(selectedModelId)
  const [modelURL, setModelURL] = useState<string>('')

  // Auto-select first model
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id)
    }
  }, [models, selectedModelId])

  // Convert base64 to object URL when model is loaded
  useEffect(() => {
    if (model && model.fileData) {
      const objectURL = base64ToObjectURL(model.fileData, model.mimeType)
      setModelURL(objectURL)

      // Cleanup function to revoke object URL
      return () => {
        URL.revokeObjectURL(objectURL)
      }
    }
  }, [model])

  if (modelsLoading) {
    return (
      <div className={`flex items-center justify-center p-12 bg-slate-900 rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-3" />
          <p className="text-slate-300">Loading 3D models...</p>
        </div>
      </div>
    )
  }

  if (modelsError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-700 mb-2">
          <AlertCircle className="h-6 w-6" />
          <span className="font-semibold">Error Loading Models</span>
        </div>
        <p className="text-red-600 text-sm">{modelsError}</p>
        <p className="text-red-500 text-xs mt-2">Make sure MongoDB is connected and models are uploaded.</p>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-200 mb-2">No Models Available</h3>
        <p className="text-slate-400 text-sm mb-4">
          Upload 3D models from the admin panel to enable AR try-on.
        </p>
        <Button asChild variant="outline" className="border-slate-600 text-slate-300">
          <a href="/admin">Go to Admin Panel</a>
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Model Selector */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select 3D Model
        </label>
        <Select value={selectedModelId || undefined} onValueChange={setSelectedModelId}>
          <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Choose a model..." />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center justify-between gap-4">
                  <span>{model.name}</span>
                  <span className="text-xs text-slate-500">
                    {model.format.toUpperCase()} · {(model.fileSize / (1024 * 1024)).toFixed(2)}MB
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Model Info */}
        {model && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Category:</span>
              <span className="text-slate-200 capitalize">{model.category}</span>
            </div>
            {model.description && (
              <div className="mt-2">
                <span className="text-slate-400 text-sm">Description:</span>
                <p className="text-slate-300 text-sm mt-1">{model.description}</p>
              </div>
            )}
            {model.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {model.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-violet-900/30 text-violet-300 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AR Viewer/Try-on */}
      {modelLoading ? (
        <div className="flex items-center justify-center p-12 bg-slate-900 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-slate-300">Loading 3D model data...</p>
          </div>
        </div>
      ) : modelURL ? (
        mode === 'tryon' ? (
          <ARVirtualTryon modelUrl={modelURL} className="w-full" />
        ) : (
          <ModelViewerAR
            glbUrl={modelURL}
            poster="/api/placeholder/400/400"
            alt={model?.name || 'AR Model'}
          />
        )
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">Select a model to view in AR</p>
        </div>
      )}
    </div>
  )
}
