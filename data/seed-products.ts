// NOTE: modelUrl currently points to a sample duck GLB available in this environment.
// Replace with Supabase Storage public URLs after upload (AdminUploader).

export type SeedProduct = {
  id: string
  title: string
  description: string
  category: "shirt" | "pants"
  sizes: string[]
  priceCents: number
  stock: number
  previewImage: string
  modelUrl: string
}

export const seedProducts: SeedProduct[] = [
  {
    id: "classic-tee",
    title: "Classic Tee",
    description:
      "A timeless crew-neck T‑shirt crafted from ultra-soft, breathable 100% cotton. Features a smooth hand-feel, reinforced neckline that holds its shape, and a relaxed everyday fit. Perfect as a base layer or a clean standalone look. • Material: 100% combed cotton • Weight: Mid-weight for all-season comfort • Fit: Regular fit, true to size • Care: Machine wash cold, tumble dry low • Details: Tagless neck label for itch-free wear.",
    category: "shirt",
    sizes: ["S", "M", "L", "XL"],
    priceCents: 2500,
    stock: 12,
    previewImage: "/assets/3d/t-shirt (1).glb",
    modelUrl: "/assets/3d/t-shirt (1).glb",
  },
  {
    id: "relaxed-tee",
    title: "Relaxed Tee",
    description:
      "An easygoing oversized tee built for laid-back comfort. Slightly dropped shoulders and extra room through the body for a modern silhouette. • Material: Cotton-rich jersey with a soft drape • Fit: Relaxed/oversized—size down for a closer fit • Care: Machine wash cold, line dry for best shape • Details: Ribbed collar, double-stitched hems, pre-shrunk fabric.",
    category: "shirt",
    sizes: ["S", "M", "L", "XL"],
    priceCents: 2800,
    stock: 7,
    previewImage: "/assets/3d/t-shirts_homme.glb",
    modelUrl: "/assets/3d/t-shirts_homme.glb",
  },
  {
    id: "denim-shirt",
    title: "Denim Shirt",
    description:
      "A versatile denim shirt that dresses up or down with ease. Balanced structure with just the right softness, perfect over a tee or under a jacket. • Material: Durable cotton denim • Fit: Regular with room to layer • Care: Machine wash cold, wash inside out • Details: Chest pocket, matte buttons, triple-stitched seams for longevity.",
    category: "shirt",
    sizes: ["S", "M", "L", "XL"],
    priceCents: 4500,
    stock: 6,
    previewImage: "/assets/3d/unisex_denim_shirt_design.glb",
    modelUrl: "/assets/3d/unisex_denim_shirt_design.glb",
  },
  {
    id: "baggy-pants",
    title: "Baggy Pants",
    description:
      "Laid-back pants with a roomy, tapered leg for everyday ease. Elasticized waistband with an internal drawcord ensures a comfy, secure fit. • Material: Soft cotton-blend twill with a touch of stretch • Fit: Relaxed through hip and thigh, tapered at the ankle • Care: Machine wash cold • Details: Deep hand pockets, secure back pocket, reinforced stitching.",
    category: "pants",
    sizes: ["28", "30", "32", "34"],
    priceCents: 5400,
    stock: 8,
    previewImage: "/assets/3d/baggy_pants_free.glb",
    modelUrl: "/assets/3d/baggy_pants_free.glb",
  },
  {
    id: "men-jacket",
    title: "Men's Jacket",
    description:
      "A clean, modern jacket designed for lightweight warmth and all-day wear. Wind-resistant shell with a smooth lining for easy layering. • Material: Poly-cotton shell with soft lining • Fit: Streamlined, true to size • Care: Spot clean or gentle machine wash • Details: Zip front, secure pockets, stand collar, subtle tonal branding.",
    category: "shirt",
    sizes: ["S", "M", "L", "XL"],
    priceCents: 7500,
    stock: 5,
    previewImage: "/assets/3d/men_jacket.glb",
    modelUrl: "/assets/3d/men_jacket.glb",
  },
]
