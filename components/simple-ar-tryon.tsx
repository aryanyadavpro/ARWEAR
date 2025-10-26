"use client"

import AdvancedCameraTryon from "./advanced-camera-tryon"

interface SimpleARTryOnProps {
  modelUrl: string
  className?: string
}

export default function SimpleARTryOn({ modelUrl, className }: SimpleARTryOnProps) {
  // Use the advanced camera component with all the improvements
  return <AdvancedCameraTryon modelUrl={modelUrl} className={className} />
}
