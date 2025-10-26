import { useState, useEffect } from 'react'

export interface Model3D {
  id: string
  name: string
  description: string
  category: string
  format: string
  fileSize: number
  mimeType: string
  thumbnail: string | null
  tags: string[]
  arEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Model3DWithData extends Model3D {
  fileData: string // base64 encoded
}

export function use3DModels(category?: string) {
  const [models, setModels] = useState<Model3D[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true)
        const url = category ? `/api/models?category=${category}` : '/api/models'
        const response = await fetch(url)
        const data = await response.json()

        if (data.success) {
          setModels(data.models)
        } else {
          throw new Error(data.error || 'Failed to fetch models')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [category])

  return { models, loading, error, refetch: () => setLoading(true) }
}

export function use3DModel(id: string | null) {
  const [model, setModel] = useState<Model3DWithData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setModel(null)
      return
    }

    const fetchModel = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/models/${id}`)
        const data = await response.json()

        if (data.success) {
          setModel(data.model)
        } else {
          throw new Error(data.error || 'Failed to fetch model')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchModel()
  }, [id])

  return { model, loading, error }
}

// Convert base64 to blob URL for use in AR viewers
export function base64ToObjectURL(base64Data: string, mimeType: string): string {
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  
  return URL.createObjectURL(blob)
}
