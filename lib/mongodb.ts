import mongoose from 'mongoose'

const MONGODB_DB = process.env.MONGODB_DB

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections growing exponentially
// during API Route usage.
interface MongooseConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      // Use dbName if provided via env; otherwise, the db from the URI (or 'test') will be used
      dbName: MONGODB_DB,
      // Fail fast if the cluster is unreachable
      serverSelectionTimeoutMS: 10000,
    } as const

    cached!.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    throw e
  }

  return cached!.conn
}

export default connectDB
