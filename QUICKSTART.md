# Quick Start Guide - 3D Model Upload & AR Features

## 🚀 Getting Started

### Prerequisites
- MongoDB connection configured in `.env.local`
- Node.js and pnpm installed
- 3D models in GLB, GLTF, or USDZ format

### Step 1: Start the Development Server
```bash
pnpm dev
```
Server will start at `http://localhost:3002`

## 📤 Uploading 3D Models

### Option A: Using the Web Interface (Recommended)

1. **Navigate to Admin Panel**
   ```
   http://localhost:3002/admin
   ```

2. **Upload a Model**
   - Drag and drop a GLB/GLTF/USDZ file or click "Browse Files"
   - Fill in the model details:
     - Name: Display name for the model
     - Description: Brief description
     - Category: clothing, accessories, footwear, or other
     - Tags: Comma-separated tags for search
   - Click "Upload Model"

3. **Verify Upload**
   - Check the "Uploaded Models" section
   - You should see your model listed with metadata

### Option B: Using the Upload Script

For bulk uploads of existing models:

1. **Install dependencies** (if not already done):
   ```bash
   npm install form-data node-fetch
   ```

2. **Place your models** in `public/assets/3d/`

3. **Run the upload script**:
   ```bash
   node scripts/upload-existing-models.js
   ```

4. **Monitor progress** - The script will upload all GLB files and show results

## 🎯 Testing AR Features

### AR Test Lab

1. **Navigate to AR Test Page**
   ```
   http://localhost:3002/ar-test
   ```

2. **Select a Model**
   - Choose a model from the dropdown
   - Wait for it to load (shows base64 data conversion)

3. **Choose Mode**
   - **AR Viewer**: For viewing models in your space
   - **Virtual Try-On**: For trying on clothing with camera

### AR Viewer Mode

**Desktop:**
- Rotate: Click and drag
- Zoom: Scroll wheel
- Scale: Use +/- buttons

**Mobile:**
- Click "View in AR" button
- Point camera at flat surface
- Tap to place model
- Pinch to scale, drag to rotate

### Virtual Try-On Mode

1. **Allow camera access** when prompted
2. **Position yourself** 1-2 meters from camera
3. **Keep upper body visible** in frame
4. **Wait for detection** - Model will overlay automatically
5. **Capture photo** using the download button

## 🔧 Integration with Products

### In Your Product Component

```tsx
import ARModelSelector from '@/components/ar-model-selector'

function ProductPage() {
  return (
    <div>
      {/* Other product details */}
      
      <ARModelSelector 
        mode="viewer"          // or "tryon"
        category="clothing"    // optional filter
      />
    </div>
  )
}
```

### Linking Products to Models

When creating/updating products, include the `modelId`:

```javascript
const product = {
  name: "Cool Jacket",
  price: 99.99,
  // ... other fields
  modelId: "the_model_id_from_mongodb"
}
```

## 📱 Mobile AR Support

### iOS (ARKit)
- **Browser**: Safari
- **Format**: GLB or USDZ
- **Requirements**: iOS 12+ with ARKit support
- **Feature**: Quick Look AR

### Android (ARCore)
- **Browser**: Chrome
- **Format**: GLB
- **Requirements**: Android 7.0+ with ARCore support
- **Feature**: Scene Viewer

## 🐛 Troubleshooting

### Models Not Showing Up

**Check MongoDB Connection:**
```bash
# In browser console
await fetch('/api/health').then(r => r.json())
```

**Check Models API:**
```bash
# In browser console
await fetch('/api/models').then(r => r.json())
```

### Upload Fails

- Check file size (< 50MB)
- Verify file format (GLB, GLTF, USDZ)
- Check MongoDB connection
- Look at browser console for errors

### AR Not Working

**Desktop:**
- AR placement won't work (expected)
- Use 3D preview with controls

**Mobile:**
- Ensure HTTPS (or localhost for dev)
- Allow camera permissions
- Check device AR compatibility
- Verify model format matches platform

### Virtual Try-On Issues

- **Camera not working**: Check browser permissions
- **No body detection**: Ensure good lighting, full body visible
- **Model not fitting**: Try different model or adjust distance from camera
- **Performance issues**: Try lower resolution models

## 📊 Monitoring

### Check Uploaded Models
```javascript
// In browser console
const response = await fetch('/api/models')
const data = await response.json()
console.log('Models:', data.models)
```

### Check MongoDB Status
```javascript
// In browser console
const response = await fetch('/api/health')
const data = await response.json()
console.log('Database:', data)
```

## 🎨 Model Optimization Tips

### File Size
- Keep under 10MB for best performance
- Use texture compression
- Remove unnecessary animations

### Polygon Count
- Target < 50k triangles for mobile
- Use LOD (Level of Detail) if possible
- Optimize mesh topology

### Textures
- Use power-of-2 dimensions (512, 1024, 2048)
- Compress to JPEG where possible
- Bake lighting into textures

### Testing Tools
- [glTF Validator](https://github.khronos.org/glTF-Validator/)
- [Blender](https://www.blender.org/) for model optimization
- [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) for compression

## 📚 Next Steps

1. ✅ Upload your 3D models
2. ✅ Test in AR viewer
3. ✅ Try virtual try-on
4. 📝 Link models to products
5. 🎨 Optimize model performance
6. 🚀 Deploy to production

## 🆘 Need Help?

**Common Issues:**
- [MongoDB Connection Issues](./AR_FEATURES.md#troubleshooting)
- [AR Feature Problems](./AR_FEATURES.md#ar-not-working)
- [Performance Optimization](./AR_FEATURES.md#performance-considerations)

**Resources:**
- Full Documentation: [AR_FEATURES.md](./AR_FEATURES.md)
- API Reference: See [AR_FEATURES.md#api-endpoints](./AR_FEATURES.md#api-endpoints)
- Component Docs: See [AR_FEATURES.md#components](./AR_FEATURES.md#components)

## ✨ Features Summary

✅ **Implemented:**
- MongoDB-based 3D model storage
- Drag-and-drop upload interface
- AR viewing with model-viewer
- Virtual try-on with pose detection
- Model management (list, delete, update)
- Automatic clothing fit detection
- Screenshot capture
- Cross-platform AR support

🔄 **Coming Soon:**
- Thumbnail generation
- Model compression
- Batch upload
- GridFS integration
- Analytics tracking
