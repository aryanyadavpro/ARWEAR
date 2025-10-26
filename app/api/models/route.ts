import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Model3D from '@/models/Model3D'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const query: any = {}
    if (category) {
      query.category = category
    }

    const models = await Model3D.find(query)
      .select('-fileData') // Exclude large file data from list
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const total = await Model3D.countDocuments(query)

    return NextResponse.json(
      {
        success: true,
        models: models.map(model => ({
          id: model._id,
          name: model.name,
          description: model.description,
          category: model.category,
          format: model.format,
          fileSize: model.fileSize,
          thumbnail: model.thumbnail,
          tags: model.tags,
          arEnabled: model.arEnabled,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
        })),
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching 3D models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch 3D models', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    const deletedModel = await Model3D.findByIdAndDelete(id)

    if (!deletedModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: '3D model deleted successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting 3D model:', error)
    return NextResponse.json(
      { error: 'Failed to delete 3D model', details: error.message },
      { status: 500 }
    )
  }
}
