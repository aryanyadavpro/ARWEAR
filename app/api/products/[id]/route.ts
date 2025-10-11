import { NextRequest, NextResponse } from 'next/server'
import databaseService from '@/lib/database'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

// GET /api/products/[id] - Get single product by ID
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const product = await databaseService.getProductById(id)
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: `No product found with ID: ${id}`,
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Add AR/VR compatibility flags
    const enhancedProduct = {
      ...product,
      arCompatible: Boolean(product.modelUrl),
      vrCompatible: Boolean(product.modelUrl && product.category?.toLowerCase().includes('headset')),
      features: {
        ar: Boolean(product.modelUrl),
        vr: Boolean(product.modelUrl && product.category?.toLowerCase().includes('headset')),
        threeDModel: Boolean(product.modelUrl),
        virtualTryOn: Boolean(product.modelUrl),
        ...product.features
      }
    }

    return NextResponse.json({
      success: true,
      data: enhancedProduct,
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error(`Product GET error for ID ${context.params.id}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch product',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const body = await request.json()
    
    // Remove sensitive fields that shouldn't be updated via API
    const allowedUpdates = { ...body }
    delete allowedUpdates.id
    delete allowedUpdates.createdAt
    
    // Update price fields if provided
    if (allowedUpdates.price) {
      allowedUpdates.price = parseFloat(allowedUpdates.price)
    }
    if (allowedUpdates.originalPrice) {
      allowedUpdates.originalPrice = parseFloat(allowedUpdates.originalPrice)
    }
    
    // Update AR/VR flags based on modelUrl
    if (allowedUpdates.modelUrl) {
      allowedUpdates.arEnabled = true
      allowedUpdates.vrEnabled = allowedUpdates.category?.toLowerCase().includes('headset') || false
    }

    const result = await databaseService.updateProduct(id, allowedUpdates)
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: `No product found with ID: ${id}`,
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        updated: result.modifiedCount > 0,
        modifiedCount: result.modifiedCount
      },
      message: result.modifiedCount > 0 ? 'Product updated successfully' : 'No changes made',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error(`Product PUT error for ID ${context.params.id}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update product',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // In production, you might want to soft delete instead
    // For now, we'll implement a simple response since the database service
    // doesn't have a delete method yet
    
    return NextResponse.json({
      success: false,
      error: 'Delete operation not implemented',
      message: 'Product deletion is not currently supported. Use PUT to update inStock to false.',
      timestamp: new Date().toISOString()
    }, { status: 501 })
  } catch (error) {
    console.error(`Product DELETE error for ID ${context.params.id}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete product',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}