import { NextResponse } from 'next/server'
import databaseService from '@/lib/database'

// Force dynamic so the env and DB checks run on each request
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const hasMongoUri = Boolean(process.env.MONGODB_URI)
    const hasJwtSecret = Boolean(process.env.JWT_SECRET || 'arwear-secret-key-2024')
    const hasDbName = Boolean(process.env.MONGODB_DB)
    
    // Check database health
    const dbHealth = await databaseService.healthCheck()
    
    // Try to get sample data to test functionality
    let dataTest = { status: 'unknown', count: 0 }
    try {
      const products = await databaseService.getProducts({}, 5)
      dataTest = {
        status: 'ok',
        count: products?.length || 0
      }
    } catch (error) {
      dataTest = {
        status: 'error',
        count: 0
      }
    }

    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      },
      config: {
        hasMongoUri,
        hasJwtSecret,
        hasDbName,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      database: dbHealth,
      data: dataTest,
      api: {
        version: '2.0.0',
        name: 'ARWEAR API',
        features: ['authentication', 'products', 'ar-vr', 'orders']
      }
    }

    return NextResponse.json(systemHealth, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'System health check failed'
    }, { status: 500 })
  }
}
