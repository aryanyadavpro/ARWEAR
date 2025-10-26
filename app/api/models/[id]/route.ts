import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Model3D from '@/models/Model3D'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const { id } = params
    const { searchParams } = new URL(request.url)
    const downloadFile = searchParams.get('download') === 'true'

    const model = await Model3D.findById(id)

    if (!model) {
      return NextResponse.json(
        { error: '3D model not found' },
        { status: 404 }
      )
    }

    // If download parameter is true, return the file data as binary
    if (downloadFile) {
      const headers = new Headers()
      headers.set('Content-Type', model.mimeType || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${model.name}.${model.format}"`)
      headers.set('Content-Length', model.fileSize.toString())

      return new NextResponse(model.fileData, {
        status: 200,
        headers,
      })
    }

    // Otherwise return model metadata with base64 encoded file data
    return NextResponse.json(
      {
        success: true,
        model: {
          id: model._id,
          name: model.name,
          description: model.description,
          category: model.category,
          format: model.format,
          fileData: model.fileData.toString('base64'),
          fileSize: model.fileSize,
          mimeType: model.mimeType,
          thumbnail: model.thumbnail,
          tags: model.tags,
          arEnabled: model.arEnabled,
          metadata: model.metadata,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch 3D model', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const { id } = params
    const body = await request.json()

    const allowedUpdates = ['name', 'description', 'category', 'tags', 'arEnabled', 'thumbnail', 'metadata']
    const updates: any = {}

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key]
      }
    }

    updates.updatedAt = new Date()

    const updatedModel = await Model3D.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-fileData')

    if (!updatedModel) {
      return NextResponse.json(
        { error: '3D model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: '3D model updated successfully',
        model: {
          id: updatedModel._id,
          name: updatedModel.name,
          description: updatedModel.description,
          category: updatedModel.category,
          format: updatedModel.format,
          fileSize: updatedModel.fileSize,
          thumbnail: updatedModel.thumbnail,
          tags: updatedModel.tags,
          arEnabled: updatedModel.arEnabled,
          updatedAt: updatedModel.updatedAt,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to update 3D model', details: error.message },
      { status: 500 }
    )
  }
}
