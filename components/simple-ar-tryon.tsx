"use client"

import VirtualTryon from "./virtual-tryon"

interface SimpleARTryOnProps {
  modelUrl: string
  className?: string
}

export default function SimpleARTryOn({ modelUrl, className }: SimpleARTryOnProps) {
  // Use the new rebuilt virtual try-on component
  return <VirtualTryon modelUrl={modelUrl} className={className} />
}
