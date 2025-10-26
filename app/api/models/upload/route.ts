import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Model3D from '@/models/Model3D'

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string || ''
    const category = formData.get('category') as string || 'clothing'
    const tags = formData.get('tags') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['glb', 'gltf', 'usdz']

    if (!allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only GLB, GLTF, and USDZ files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : []

    // Create new model document
    const newModel = new Model3D({
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      description,
      category,
      format: fileExtension,
      fileData: buffer,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      tags: tagsArray,
      arEnabled: true,
    })

    await newModel.save()

    return NextResponse.json(
      {
        success: true,
        message: '3D model uploaded successfully',
        model: {
          id: newModel._id,
          name: newModel.name,
          category: newModel.category,
          format: newModel.format,
          fileSize: newModel.fileSize,
          createdAt: newModel.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error uploading 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to upload 3D model', details: error.message },
      { status: 500 }
    )
  }
}
