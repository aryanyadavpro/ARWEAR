/**
 * Script to upload existing 3D models from public/assets/3d to MongoDB
 * Run with: node scripts/upload-existing-models.js
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

const MODELS_DIR = path.join(__dirname, '../public/assets/3d')
const API_URL = 'http://localhost:3002/api/models/upload'

// Model metadata mapping
const modelMetadata = {
  'men_jacket.glb': {
    name: 'Men\'s Casual Jacket',
    description: 'Stylish casual jacket for men',
    category: 'clothing',
    tags: 'jacket,men,casual,outerwear'
  },
  'baggy_pants_free.glb': {
    name: 'Baggy Pants',
    description: 'Comfortable baggy pants',
    category: 'clothing',
    tags: 'pants,baggy,casual,streetwear'
  },
  't-shirt (1).glb': {
    name: 'Classic T-Shirt',
    description: 'Basic classic t-shirt',
    category: 'clothing',
    tags: 'tshirt,basic,casual,everyday'
  },
  't-shirt-1.glb': {
    name: 'Premium T-Shirt',
    description: 'Premium quality t-shirt',
    category: 'clothing',
    tags: 'tshirt,premium,casual'
  },
  't-shirts_homme.glb': {
    name: 'Men\'s Designer T-Shirt',
    description: 'Designer t-shirt for men',
    category: 'clothing',
    tags: 'tshirt,men,designer,fashion'
  },
  'unisex_denim_shirt_design.glb': {
    name: 'Unisex Denim Shirt',
    description: 'Stylish unisex denim shirt',
    category: 'clothing',
    tags: 'shirt,denim,unisex,casual'
  }
}

async function uploadModel(filePath, metadata) {
  try {
    const fileName = path.basename(filePath)
    console.log(`\n📤 Uploading ${fileName}...`)

    const fileStream = fs.createReadStream(filePath)
    const stats = fs.statSync(filePath)
    
    const formData = new FormData()
    formData.append('file', fileStream, fileName)
    formData.append('name', metadata.name)
    formData.append('description', metadata.description)
    formData.append('category', metadata.category)
    formData.append('tags', metadata.tags)

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    })

    const result = await response.json()

    if (response.ok) {
      console.log(`✅ Success: ${metadata.name}`)
      console.log(`   - Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`)
      console.log(`   - ID: ${result.model.id}`)
      return true
    } else {
      console.error(`❌ Failed: ${result.error}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error uploading ${path.basename(filePath)}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting 3D Model Upload to MongoDB\n')
  console.log(`📁 Source Directory: ${MODELS_DIR}`)
  console.log(`🌐 API Endpoint: ${API_URL}\n`)

  // Check if directory exists
  if (!fs.existsSync(MODELS_DIR)) {
    console.error(`❌ Directory not found: ${MODELS_DIR}`)
    process.exit(1)
  }

  // Get all GLB files
  const files = fs.readdirSync(MODELS_DIR)
    .filter(file => file.endsWith('.glb'))

  if (files.length === 0) {
    console.log('⚠️  No GLB files found in directory')
    process.exit(0)
  }

  console.log(`📦 Found ${files.length} model(s) to upload\n`)

  let successCount = 0
  let failCount = 0

  for (const file of files) {
    const filePath = path.join(MODELS_DIR, file)
    const metadata = modelMetadata[file] || {
      name: file.replace('.glb', ''),
      description: 'Uploaded from existing files',
      category: 'clothing',
      tags: 'clothing,3d'
    }

    const success = await uploadModel(filePath, metadata)
    if (success) {
      successCount++
    } else {
      failCount++
    }

    // Add delay between uploads
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Upload Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📦 Total: ${files.length}`)
  console.log('='.repeat(50) + '\n')

  if (successCount > 0) {
    console.log('🎉 Models uploaded successfully!')
    console.log('👉 Visit http://localhost:3002/admin to view your models')
    console.log('👉 Visit http://localhost:3002/ar-test to test AR features')
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
