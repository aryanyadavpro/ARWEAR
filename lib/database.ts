import { MongoClient, Db } from 'mongodb'

interface DatabaseConfig {
  uri: string
  dbName: string
  options?: any
}

class DatabaseService {
  private client: MongoClient | null = null
  private db: Db | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  private config: DatabaseConfig = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB || 'arwear',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      writeConcern: { w: 'majority' }
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.establishConnection()
    return this.connectionPromise
  }

  private async establishConnection(): Promise<void> {
    try {
      console.log('Connecting to MongoDB...')
      
      this.client = new MongoClient(this.config.uri, this.config.options)
      await this.client.connect()
      
      // Test the connection
      await this.client.db('admin').command({ ping: 1 })
      
      this.db = this.client.db(this.config.dbName)
      this.isConnected = true
      
      console.log('MongoDB connected successfully')
    } catch (error) {
      console.error('MongoDB connection failed:', error)
      this.isConnected = false
      this.client = null
      this.db = null
      this.connectionPromise = null
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      this.isConnected = false
      this.connectionPromise = null
      console.log('MongoDB disconnected')
    }
  }

  getDatabase(): Db {
    if (!this.db || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  isReady(): boolean {
    return this.isConnected && this.db !== null
  }

  async healthCheck(): Promise<{ status: string; details?: any; error?: string }> {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const adminDb = this.client?.db('admin')
      if (!adminDb) {
        throw new Error('Admin database not available')
      }

      const result = await adminDb.command({ ping: 1 })
      
      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          database: this.config.dbName,
          ping: result.ok === 1 ? 'success' : 'failed'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Product operations
  async getProducts(filters: any = {}, limit = 50, skip = 0) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('products')
      const products = await collection
        .find(filters)
        .skip(skip)
        .limit(limit)
        .toArray()

      return products
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  async getProductById(id: string) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('products')
      const product = await collection.findOne({ id })

      return product
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  }

  async createProduct(product: any) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('products')
      const result = await collection.insertOne({
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return result
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  async updateProduct(id: string, updates: any) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('products')
      const result = await collection.updateOne(
        { id },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      )

      return result
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  // User operations
  async getUserByEmail(email: string) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('users')
      const user = await collection.findOne({ email })

      return user
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async createUser(userData: any) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('users')
      const result = await collection.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return result
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  // Order operations
  async createOrder(orderData: any) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('orders')
      const result = await collection.insertOne({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return result
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  async getUserOrders(userId: string) {
    try {
      if (!this.isReady()) {
        await this.connect()
      }

      const collection = this.getDatabase().collection('orders')
      const orders = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()

      return orders
    } catch (error) {
      console.error('Error fetching user orders:', error)
      throw error
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService()

// Fallback data service for when database is unavailable
export class FallbackDataService {
  private products: any[] = [
    {
      id: '1',
      name: 'Premium AR Smart Glasses',
      brand: 'ARWEAR Tech',
      price: 299,
      originalPrice: 399,
      discount: 25,
      description: 'Experience the future with our premium AR smart glasses featuring advanced display technology, all-day battery life, and seamless smartphone integration.',
      category: 'Smart Glasses',
      rating: 4.5,
      reviews: 128,
      images: ['/api/placeholder/600/600'],
      modelUrl: '/models/ar-glasses.glb',
      colors: ['Black', 'Silver', 'Rose Gold', 'Blue'],
      sizes: ['One Size'],
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'VR Gaming Headset Pro',
      brand: 'ARWEAR Gaming',
      price: 499,
      originalPrice: 699,
      discount: 29,
      description: 'Immerse yourself in virtual worlds with our professional VR headset featuring 4K displays, spatial audio, and advanced hand tracking.',
      category: 'VR Headsets',
      rating: 4.8,
      reviews: 256,
      images: ['/api/placeholder/600/600'],
      modelUrl: '/models/vr-headset.glb',
      colors: ['Black', 'White'],
      sizes: ['Adjustable'],
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  private users: any[] = [
    {
      id: 'user-1',
      email: 'test@arwear.com',
      password: '$2a$10$hashedpassword', // In real app, would be properly hashed
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  private orders: any[] = []

  async getProducts(filters: any = {}, limit = 50, skip = 0) {
    let filtered = [...this.products]
    
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category)
    }
    
    return filtered.slice(skip, skip + limit)
  }

  async getProductById(id: string) {
    return this.products.find(p => p.id === id) || null
  }

  async createProduct(product: any) {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.products.push(newProduct)
    return { insertedId: newProduct.id }
  }

  async updateProduct(id: string, updates: any) {
    const index = this.products.findIndex(p => p.id === id)
    if (index === -1) {
      return { matchedCount: 0, modifiedCount: 0 }
    }
    
    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date()
    }
    
    return { matchedCount: 1, modifiedCount: 1 }
  }

  async getUserByEmail(email: string) {
    return this.users.find(u => u.email === email) || null
  }

  async createUser(userData: any) {
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.push(newUser)
    return { insertedId: newUser.id }
  }

  async createOrder(orderData: any) {
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.orders.push(newOrder)
    return { insertedId: newOrder.id }
  }

  async getUserOrders(userId: string) {
    return this.orders.filter(o => o.userId === userId)
  }
}

const fallbackService = new FallbackDataService()

// Universal database service that tries MongoDB first, falls back to in-memory
export class UniversalDatabaseService {
  private useDatabase = process.env.NODE_ENV === 'production' || Boolean(process.env.MONGODB_URI)
  private databaseHealthy = false

  async checkDatabaseHealth(): Promise<boolean> {
    if (!this.useDatabase) {
      return false
    }

    try {
      const health = await databaseService.healthCheck()
      this.databaseHealthy = health.status === 'healthy'
      return this.databaseHealthy
    } catch (error) {
      console.log('Database health check failed, using fallback')
      this.databaseHealthy = false
      return false
    }
  }

  async getProducts(filters: any = {}, limit = 50, skip = 0) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.getProducts(filters, limit, skip)
      }
    } catch (error) {
      console.log('Database query failed, using fallback:', error)
    }

    return await fallbackService.getProducts(filters, limit, skip)
  }

  async getProductById(id: string) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.getProductById(id)
      }
    } catch (error) {
      console.log('Database query failed, using fallback:', error)
    }

    return await fallbackService.getProductById(id)
  }

  async createProduct(product: any) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.createProduct(product)
      }
    } catch (error) {
      console.log('Database operation failed, using fallback:', error)
    }

    return await fallbackService.createProduct(product)
  }

  async updateProduct(id: string, updates: any) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.updateProduct(id, updates)
      }
    } catch (error) {
      console.log('Database operation failed, using fallback:', error)
    }

    return await fallbackService.updateProduct(id, updates)
  }

  async getUserByEmail(email: string) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.getUserByEmail(email)
      }
    } catch (error) {
      console.log('Database query failed, using fallback:', error)
    }

    return await fallbackService.getUserByEmail(email)
  }

  async createUser(userData: any) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.createUser(userData)
      }
    } catch (error) {
      console.log('Database operation failed, using fallback:', error)
    }

    return await fallbackService.createUser(userData)
  }

  async createOrder(orderData: any) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.createOrder(orderData)
      }
    } catch (error) {
      console.log('Database operation failed, using fallback:', error)
    }

    return await fallbackService.createOrder(orderData)
  }

  async getUserOrders(userId: string) {
    try {
      if (await this.checkDatabaseHealth()) {
        return await databaseService.getUserOrders(userId)
      }
    } catch (error) {
      console.log('Database query failed, using fallback:', error)
    }

    return await fallbackService.getUserOrders(userId)
  }

  async healthCheck() {
    if (await this.checkDatabaseHealth()) {
      return await databaseService.healthCheck()
    } else {
      return {
        status: 'fallback',
        details: {
          using: 'in-memory',
          database: 'disabled',
          products: (await fallbackService.getProducts()).length
        }
      }
    }
  }
}

export default new UniversalDatabaseService()

// Export individual services for specific use cases
export { databaseService, fallbackService }

// Mongoose-compatible connectDB function
export async function connectDB() {
  const mongoose = require('mongoose')
  
  if (mongoose.connections[0].readyState) {
    return
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}
