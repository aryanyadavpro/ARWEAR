import { NextRequest, NextResponse } from 'next/server'
import databaseService from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: any = {}
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const inStock = searchParams.get('inStock')
    const search = searchParams.get('search')

    // Build filters
    if (category) filters.category = category
    if (brand) filters.brand = brand
    if (inStock === 'true') filters.inStock = true
    if (minPrice || maxPrice) {
      filters.price = {}
      if (minPrice) filters.price.$gte = parseFloat(minPrice)
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice)
    }
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
    }

    const products = await databaseService.getProducts(filters, limit, skip)
    
    const response = {
      success: true,
      data: products,
      pagination: {
        limit,
        skip,
        total: products.length,
        hasMore: products.length === limit
      },
      filters: filters,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Products GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'price', 'description', 'category', 'brand']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`,
          timestamp: new Date().toISOString()
        }, { status: 400 })
      }
    }

    // Set defaults
    const productData = {
      id: `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: body.name,
      brand: body.brand,
      price: parseFloat(body.price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
      discount: body.discount || undefined,
      description: body.description,
      category: body.category,
      rating: body.rating || 0,
      reviews: body.reviews || 0,
      images: body.images || ['/api/placeholder/600/600'],
      modelUrl: body.modelUrl || undefined,
      colors: body.colors || ['Default'],
      sizes: body.sizes || ['One Size'],
      inStock: body.inStock !== false,
      featured: body.featured || false,
      tags: body.tags || [],
      specifications: body.specifications || {},
      arEnabled: Boolean(body.modelUrl || body.arEnabled),
      vrEnabled: body.vrEnabled || false
    }

    const result = await databaseService.createProduct(productData)
    
    return NextResponse.json({
      success: true,
      data: {
        id: productData.id,
        insertedId: result.insertedId
      },
      message: 'Product created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}