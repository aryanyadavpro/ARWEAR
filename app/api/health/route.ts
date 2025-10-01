import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

// Force dynamic so the env and DB checks run on each request
export const dynamic = 'force-dynamic'

export async function GET() {
  const hasMongoUri = Boolean(process.env.MONGODB_URI)
  const hasJwtSecret = Boolean(process.env.JWT_SECRET)
  const hasDbName = Boolean(process.env.MONGODB_DB)

  let db = { status: 'skipped' as 'skipped' | 'ok' | 'error', error: '' as string | undefined }

  if (hasMongoUri) {
    try {
      await connectDB()
      db.status = 'ok'
    } catch (e: any) {
      db.status = 'error'
      db.error = e?.message || 'DB connection failed'
    }
  }

  return NextResponse.json({
    env: {
      hasMongoUri,
      hasJwtSecret,
      hasDbName,
      node: process.version,
      runtime: 'nodejs',
    },
    db,
    time: new Date().toISOString(),
  })
}
