import mongoose from 'mongoose'

export interface IProduct extends mongoose.Document {
  name: string
  brand: string
  price: number
  originalPrice?: number
  discount?: number
  description: string
  category: string
  rating?: number
  reviews?: number
  images: string[]
  modelId?: mongoose.Types.ObjectId // Reference to Model3D
  colors?: string[]
  sizes?: string[]
  inStock: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['clothing', 'accessories', 'footwear', 'smart-glasses', 'vr-headsets', 'other']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  reviews: {
    type: Number,
    min: [0, 'Reviews count cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model3D',
    default: null
  },
  colors: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  inStock: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' })
ProductSchema.index({ category: 1 })
ProductSchema.index({ brand: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ inStock: 1 })
ProductSchema.index({ modelId: 1 })

// Prevent duplicate model compilation error
const Product = (mongoose.models && mongoose.models.Product) || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
