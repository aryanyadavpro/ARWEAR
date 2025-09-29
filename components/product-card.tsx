// @ts-nocheck
"use client"

import Link from "next/link"
import { formatInrFromUsdCents } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

export default function ProductCard({
  product,
}: {
  product: {
    id: string
    title: string
    priceCents: number
    previewImage: string
    modelUrl: string
    sizes: string[]
  }
}) {
  const [supported, setSupported] = useState(false)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    const id = "model-viewer-script"
    if (!document.getElementById(id)) {
      const s = document.createElement("script")
      s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
      s.async = true
      s.id = id
      document.head.appendChild(s)
      s.onload = () => setSupported(true)
    } else {
      setSupported(true)
    }
  }, [])

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group hover:border-blue-500">
        <div className="relative aspect-square bg-gradient-to-br from-slate-700 to-slate-800">
          {supported ? (
            <model-viewer
              ref={viewerRef}
              src={product.modelUrl}
              alt={`${product.title} 3D model`}
              camera-controls
              touch-action="pan-y"
              exposure="1.2"
              style={{ 
                width: "100%", 
                height: "100%", 
                borderRadius: "0.75rem 0.75rem 0 0",
                background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)"
              }}
            ></model-viewer>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span className="text-slate-300 text-sm font-medium">Loading 3D model...</span>
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            ✨ View in AR
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur">
          <h3 className="font-semibold text-white mb-2 text-lg">{product.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {formatInrFromUsdCents(product.priceCents)}
            </p>
            <div className="flex gap-1.5">
              {product.sizes.slice(0, 3).map((size) => (
                <span key={size} className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-medium border border-slate-600">
                  {size}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="text-xs bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 px-2.5 py-1 rounded-full font-medium border border-blue-500/30">
                  +{product.sizes.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
