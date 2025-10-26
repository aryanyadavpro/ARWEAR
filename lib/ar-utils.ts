/**
 * Shared utilities for AR try-on features
 * Simple camera-based overlay without TensorFlow
 */

export interface Keypoint {
  x: number
  y: number
  score?: number
  name?: string
}

export interface Pose {
  keypoints: Keypoint[]
  score?: number
}

/**
 * Get camera stream
 */
export async function getCameraStream(facingMode: 'user' | 'environment' = 'user') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  })
  
  return stream
}

/**
 * Draw skeleton on canvas
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  minConfidence = 0.3
) {
  // Draw keypoints
  keypoints.forEach(keypoint => {
    if (keypoint.score && keypoint.score > minConfidence) {
      ctx.beginPath()
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#00ff00'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })

  // Define skeleton connections
  const connections = [
    [5, 6],   // shoulders
    [5, 7],   // left shoulder to elbow
    [7, 9],   // left elbow to wrist
    [6, 8],   // right shoulder to elbow
    [8, 10],  // right elbow to wrist
    [5, 11],  // left shoulder to hip
    [6, 12],  // right shoulder to hip
    [11, 12], // hips
    [11, 13], // left hip to knee
    [13, 15], // left knee to ankle
    [12, 14], // right hip to knee
    [14, 16], // right knee to ankle
  ]

  // Draw connections
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2

  connections.forEach(([startIdx, endIdx]) => {
    const startPoint = keypoints[startIdx]
    const endPoint = keypoints[endIdx]

    if (startPoint && endPoint && 
        startPoint.score && startPoint.score > minConfidence &&
        endPoint.score && endPoint.score > minConfidence) {
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()
    }
  })
}

/**
 * Draw clothing overlay based on body pose
 */
export function drawClothingOverlay(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  overlayColor = 'rgba(138, 43, 226, 0.4)',
  minConfidence = 0.3
) {
  const leftShoulder = keypoints[5]
  const rightShoulder = keypoints[6]
  const leftHip = keypoints[11]
  const rightHip = keypoints[12]

  // Check if key points are detected
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return
  if (leftShoulder.score! < minConfidence || rightShoulder.score! < minConfidence) return

  // Calculate garment boundaries
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
  const shoulderY = Math.min(leftShoulder.y, rightShoulder.y)
  
  const hipY = Math.max(leftHip?.y || 0, rightHip?.y || 0)
  const garmentHeight = hipY - shoulderY

  // Draw garment shape
  ctx.save()
  
  // Main garment body
  ctx.fillStyle = overlayColor
  ctx.fillRect(
    shoulderMidX - shoulderWidth * 0.7,
    shoulderY - 20,
    shoulderWidth * 1.4,
    garmentHeight * 1.2
  )

  // Add border
  ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)'
  ctx.lineWidth = 3
  ctx.strokeRect(
    shoulderMidX - shoulderWidth * 0.7,
    shoulderY - 20,
    shoulderWidth * 1.4,
    garmentHeight * 1.2
  )

  // Add label
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Virtual Garment', shoulderMidX, shoulderY - 30)

  ctx.restore()
}

/**
 * Calculate body measurements from keypoints
 */
export function getBodyMeasurements(keypoints: Keypoint[]) {
  const leftShoulder = keypoints[5]
  const rightShoulder = keypoints[6]
  const leftHip = keypoints[11]
  const rightHip = keypoints[12]

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null
  }

  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
  const bodyHeight = Math.abs((leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2)
  const hipWidth = Math.abs(rightHip.x - leftHip.x)

  return {
    shoulderWidth,
    bodyHeight,
    hipWidth,
    shoulderToHipRatio: shoulderWidth / hipWidth
  }
}
