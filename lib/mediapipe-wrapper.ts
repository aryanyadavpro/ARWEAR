/**
 * MediaPipe Pose wrapper to handle compatibility issues with Next.js Turbopack
 * This module provides a safe way to import MediaPipe only when needed
 */

let mediapipeInstance: any = null
let loadPromise: Promise<any> | null = null

export async function loadMediaPipe() {
  // Return cached instance if already loaded
  if (mediapipeInstance) {
    return mediapipeInstance
  }

  // Return existing promise if currently loading
  if (loadPromise) {
    return loadPromise
  }

  // Load MediaPipe dynamically
  loadPromise = (async () => {
    try {
      // Use dynamic import with error handling
      const mediapipe = await import('@mediapipe/pose')
      mediapipeInstance = mediapipe
      return mediapipe
    } catch (error) {
      console.error('Failed to load MediaPipe:', error)
      throw new Error('MediaPipe is not available in this environment')
    }
  })()

  return loadPromise
}

export async function createPoseDetector(config: any) {
  try {
    // Load TensorFlow pose detection dynamically
    const poseDetection = await import('@tensorflow-models/pose-detection')
    const tf = await import('@tensorflow/tfjs-core')
    
    // Setup backend
    await import('@tensorflow/tfjs-backend-webgl')
    await tf.ready()
    
    // Create detector without MediaPipe (use MoveNet instead which works better)
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    )
    
    return detector
  } catch (error) {
    console.error('Failed to create pose detector:', error)
    throw error
  }
}

export { }
