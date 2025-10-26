# AR Features & 3D Model Upload System

## Overview
This project now includes a complete 3D model management system with MongoDB integration, allowing you to upload, store, and use 3D models for AR try-on and AR viewing experiences.

## Features

### 1. 3D Model Upload System
- **Admin Panel Upload**: Drag-and-drop interface for uploading 3D models
- **Supported Formats**: GLB, GLTF, USDZ
- **Maximum File Size**: 50MB per model
- **MongoDB Storage**: Models stored directly in MongoDB as binary data
- **Metadata Management**: Track model name, description, category, tags, and more

### 2. AR Viewing
- **Model Viewer AR**: Place 3D models in your real environment
- **Cross-Platform Support**: Works on iOS (ARKit), Android (ARCore), and WebXR
- **Interactive Controls**: Scale, rotate, and manipulate models
- **Device Detection**: Automatically adapts to mobile and desktop

### 3. Virtual Try-On
- **Real-Time Body Detection**: Uses TensorFlow.js BlazePose for pose estimation
- **Automatic Clothing Fit**: Intelligently scales and positions models based on body measurements
- **Clothing Type Detection**: Automatically detects shirts, jackets, pants, and dresses
- **Screenshot Capture**: Save your virtual try-on photos

## Architecture

### Database Schema

#### Model3D Collection
```javascript
{
  name: String,           // Model name
  description: String,    // Optional description
  category: String,       // clothing, accessories, footwear, other
  format: String,         // glb, gltf, usdz
  fileData: Buffer,       // Binary model data
  fileSize: Number,       // File size in bytes
  mimeType: String,       // MIME type
  thumbnail: String,      // Optional thumbnail URL
  tags: [String],         // Searchable tags
  arEnabled: Boolean,     // AR capability flag
  metadata: {
    vertices: Number,
    faces: Number,
    textures: [String],
    animations: Boolean
  },
  createdBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Product Collection (Updated)
```javascript
{
  // ... existing fields
  modelId: ObjectId,      // Reference to Model3D
  // ... other fields
}
```

### API Endpoints

#### Upload Model
```
POST /api/models/upload
Content-Type: multipart/form-data

Body:
- file: File (GLB/GLTF/USDZ)
- name: String
- description: String (optional)
- category: String (clothing/accessories/footwear/other)
- tags: String (comma-separated)

Response:
{
  success: true,
  message: "3D model uploaded successfully",
  model: {
    id: "...",
    name: "...",
    category: "...",
    format: "glb",
    fileSize: 1234567,
    createdAt: "..."
  }
}
```

#### List Models
```
GET /api/models?category=clothing&limit=50&skip=0

Response:
{
  success: true,
  models: [...],
  pagination: {
    total: 10,
    limit: 50,
    skip: 0,
    hasMore: false
  }
}
```

#### Get Single Model
```
GET /api/models/[id]?download=false

Response:
{
  success: true,
  model: {
    id: "...",
    name: "...",
    fileData: "base64EncodedData...",
    // ... other fields
  }
}
```

#### Download Model File
```
GET /api/models/[id]?download=true

Response: Binary file data with proper Content-Type headers
```

#### Update Model Metadata
```
PATCH /api/models/[id]
Content-Type: application/json

Body:
{
  name: "Updated Name",
  description: "...",
  tags: ["tag1", "tag2"],
  arEnabled: true
}
```

#### Delete Model
```
DELETE /api/models?id=[modelId]

Response:
{
  success: true,
  message: "3D model deleted successfully"
}
```

## Components

### AdminUploader
Location: `components/admin-uploader.tsx`
- Full-featured upload interface with drag-and-drop
- Real-time validation and progress tracking
- Model management (list, view, delete)
- Form for metadata entry

### ARModelSelector
Location: `components/ar-model-selector.tsx`
- Fetches models from MongoDB
- Converts base64 data to Blob URLs
- Provides dropdown selection
- Integrates with AR viewers

### ModelViewerAR
Location: `components/model-viewer-ar.tsx`
- Google Model Viewer integration
- AR placement in real space
- Scale and rotation controls
- Platform-specific AR modes

### ARVirtualTryon
Location: `components/ar-virtual-tryon.tsx`
- Real-time camera feed
- TensorFlow.js pose detection
- Automatic clothing fitting
- Screenshot capture

## Custom Hooks

### use3DModels
```typescript
const { models, loading, error, refetch } = use3DModels(category?)
```
Fetches list of models from API

### use3DModel
```typescript
const { model, loading, error } = use3DModel(modelId)
```
Fetches single model with file data

### base64ToObjectURL
```typescript
const objectURL = base64ToObjectURL(base64Data, mimeType)
```
Converts base64 data to usable Blob URL

## Usage Guide

### 1. Upload Models

1. Navigate to `/admin`
2. Use the "Upload 3D Model" section
3. Drag and drop your GLB/GLTF/USDZ file or browse
4. Fill in model details (name, description, category, tags)
5. Click "Upload Model"

### 2. Test AR Features

1. Navigate to `/ar-test`
2. Select a model from the dropdown
3. Choose between "AR Viewer" or "Virtual Try-On" mode
4. For AR Viewer: Click "View in AR" to place in your space
5. For Virtual Try-On: Allow camera access and try on clothing

### 3. Integrate with Products

```typescript
// In your product page/component
import ARModelSelector from '@/components/ar-model-selector'

// Use with a specific model
<ARModelSelector mode="viewer" />

// Or filter by category
<ARModelSelector mode="tryon" category="clothing" />
```

## Configuration

### Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### Model Size Limits
Adjust in `app/api/models/upload/route.ts`:
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
```

### Supported Categories
Edit in `models/Model3D.ts`:
```typescript
enum: ['clothing', 'accessories', 'footwear', 'other']
```

## Performance Considerations

1. **File Size**: Keep models under 10MB for best performance
2. **Texture Optimization**: Use compressed textures (e.g., JPEG instead of PNG)
3. **Polygon Count**: Aim for < 50k triangles for mobile devices
4. **Caching**: Blob URLs are cached during component lifecycle
5. **Lazy Loading**: Models are fetched only when selected

## Browser Compatibility

### AR Viewer
- ✅ iOS Safari (ARKit)
- ✅ Android Chrome (ARCore)
- ✅ WebXR-capable browsers
- ⚠️ Desktop (3D preview only)

### Virtual Try-On
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox
- ✅ Safari (Desktop & Mobile)
- ⚠️ Requires camera access

## Troubleshooting

### Models Not Loading
- Check MongoDB connection
- Verify model file format (GLB/GLTF/USDZ)
- Check browser console for errors
- Ensure model file is < 50MB

### AR Not Working
- Use HTTPS (required for AR)
- Enable camera permissions
- Try on ARCore/ARKit compatible device
- Check model format (GLB for Android, USDZ for iOS)

### Virtual Try-On Issues
- Ensure good lighting
- Stand 1-2 meters from camera
- Keep full upper body in frame
- Allow camera permissions
- Try different clothing detection

## Future Enhancements

- [ ] GridFS integration for larger files
- [ ] Thumbnail generation
- [ ] Model compression on upload
- [ ] Batch upload support
- [ ] Model version control
- [ ] Analytics and usage tracking
- [ ] Social sharing of try-on photos
- [ ] AI-powered size recommendations

## Support

For issues or questions, check:
1. Browser console for errors
2. MongoDB connection status
3. Camera permissions
4. Network requests in DevTools
5. Model file validity

## Credits

- **3D Model Viewer**: Google Model Viewer
- **Pose Detection**: TensorFlow.js BlazePose
- **3D Graphics**: Three.js
- **Database**: MongoDB with Mongoose
