"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Model3D {
  id: string
  name: string
  description: string
  category: string
  format: string
  fileSize: number
  tags: string[]
  arEnabled: boolean
  createdAt: string
}

export default function AdminUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('clothing')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [models, setModels] = useState<Model3D[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch existing models
  const fetchModels = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      if (data.success) {
        setModels(data.models)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const allowedExtensions = ['glb', 'gltf', 'usdz']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!allowedExtensions.includes(fileExtension || '')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a GLB, GLTF, or USDZ file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB.',
        variant: 'destructive',
      })
      return
    }

    setFile(file)
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a 3D model file to upload.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('tags', tags)

      const response = await fetch('/api/models/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Upload successful',
          description: `${data.model.name} has been uploaded successfully.`,
        })

        // Reset form
        setFile(null)
        setName('')
        setDescription('')
        setCategory('clothing')
        setTags('')
        setUploadProgress(100)

        // Refresh models list
        fetchModels()
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return

    try {
      const response = await fetch(`/api/models?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Model deleted',
          description: 'The 3D model has been deleted successfully.',
        })
        fetchModels()
      } else {
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload 3D Model</h2>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".glb,.gltf,.usdz"
            onChange={handleFileInput}
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop your 3D model here, or</p>
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: GLB, GLTF, USDZ (Max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="name">Model Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter model name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter model description"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="footwear">Footwear</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. tshirt, casual, summer"
              className="mt-1"
            />
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{uploadProgress}%</p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || !name || uploading}
          className="w-full mt-6 bg-violet-600 hover:bg-violet-700"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Model
            </>
          )}
        </Button>
      </div>

      {/* Existing Models Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Uploaded Models</h2>
          <Button variant="outline" size="sm" onClick={fetchModels}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No models uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{model.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{model.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(model.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Format:</span> {model.format.toUpperCase()}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Size:</span> {formatFileSize(model.fileSize)}
                  </p>
                  {model.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {model.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
