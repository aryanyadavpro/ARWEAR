"use client"

import { useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminUploader() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [glbPath, setGlbPath] = useState<string>("")
  const [imagePath, setImagePath] = useState<string>("")
  const [anchor, setAnchor] = useState<{ x: number; y: number; z: number; scale: number; rot: number }>({
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rot: 0,
  })
  const imgInputRef = useRef<HTMLInputElement | null>(null)
  const glbInputRef = useRef<HTMLInputElement | null>(null)

  async function uploadToBucket(file: File, bucket: string) {
    const key = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(key, file, { cacheControl: "3600", upsert: false })
    if (error) throw error
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return pub.publicUrl
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm block mb-1">Upload .glb (draco-compressed)</label>
        <input ref={glbInputRef} type="file" accept=".glb" aria-label="Upload GLB" />
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={async () => {
              const f = glbInputRef.current?.files?.[0]
              if (!f) return
              const url = await uploadToBucket(f, "models")
              setGlbPath(url)
            }}
          >
            Upload GLB
          </Button>
        </div>
        {glbPath && <p className="text-xs mt-2 break-all">Model URL: {glbPath}</p>}
      </div>

      <div>
        <label className="text-sm block mb-1">Upload preview image</label>
        <input ref={imgInputRef} type="file" accept="image/*" aria-label="Upload preview image" />
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={async () => {
              const f = imgInputRef.current?.files?.[0]
              if (!f) return
              const url = await uploadToBucket(f, "previews")
              setImagePath(url)
            }}
          >
            Upload Image
          </Button>
        </div>
        {imagePath && <p className="text-xs mt-2 break-all">Image URL: {imagePath}</p>}
      </div>

      {/* Simple anchor editor on 2D preview */}
      <div>
        <label className="text-sm block mb-1">Anchor Offsets (preview-only)</label>
        <div className="grid grid-cols-5 gap-2">
          <Input
            type="number"
            value={anchor.x}
            onChange={(e) => setAnchor((a) => ({ ...a, x: Number(e.target.value) }))}
            placeholder="x"
          />
          <Input
            type="number"
            value={anchor.y}
            onChange={(e) => setAnchor((a) => ({ ...a, y: Number(e.target.value) }))}
            placeholder="y"
          />
          <Input
            type="number"
            value={anchor.z}
            onChange={(e) => setAnchor((a) => ({ ...a, z: Number(e.target.value) }))}
            placeholder="z"
          />
          <Input
            type="number"
            step="0.1"
            value={anchor.scale}
            onChange={(e) => setAnchor((a) => ({ ...a, scale: Number(e.target.value) }))}
            placeholder="scale"
          />
          <Input
            type="number"
            value={anchor.rot}
            onChange={(e) => setAnchor((a) => ({ ...a, rot: Number(e.target.value) }))}
            placeholder="rot"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Admins should tune offsets per garment. Stored as JSON alongside the model metadata.
        </p>
      </div>

      <div>
        <Button
          onClick={async () => {
            // models_meta: { glb_url, preview_url, anchor_json }
            await supabase.from("models_meta").insert({
              glb_url: glbPath,
              preview_url: imagePath,
              anchor_json: anchor,
            })
            alert("Saved model metadata")
          }}
        >
          Save Metadata
        </Button>
      </div>
    </div>
  )
}
