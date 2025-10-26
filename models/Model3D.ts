import mongoose from 'mongoose'

const Model3DSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Model name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['clothing', 'accessories', 'footwear', 'other'],
    default: 'clothing'
  },
  format: {
    type: String,
    required: true,
    enum: ['glb', 'gltf', 'usdz'],
    default: 'glb'
  },
  fileData: {
    type: Buffer,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  arEnabled: {
    type: Boolean,
    default: true
  },
  metadata: {
    vertices: Number,
    faces: Number,
    textures: [String],
    animations: Boolean
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update the updatedAt timestamp before saving
Model3DSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Create indexes for better query performance
Model3DSchema.index({ name: 1 })
Model3DSchema.index({ category: 1 })
Model3DSchema.index({ createdAt: -1 })

export default mongoose.models.Model3D || mongoose.model('Model3D', Model3DSchema)
