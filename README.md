# AR Cloth — E‑Commerce with AR + Try-On (Next.js)

Modern e-commerce demo with:
- AR “View at your home” via <model-viewer> (plus 3D fallback)
- CV-based Try-On skeleton using camera overlay and throttling (on-device)
- MongoDB integration (planned)
- Stripe Checkout (test) + webhook
- Admin dashboard for products and model metadata

Note: This demo uses Next.js App Router to run smoothly in v0 Preview (instead of Vite/react-router). The architecture matches the requested stack conceptually.

## Quick Start

1) Environment
- Environment variables for future MongoDB integration:
  - MONGODB_URI (to be added)
  - JWT_SECRET (to be added)
  - NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - NEXT_PUBLIC_SITE_URL

2) MongoDB (Future Implementation)
- MongoDB integration will be added for data storage and authentication
- File storage solution for models and images will be implemented

3) Stripe (test mode)
- Get test keys from Stripe and set env vars.
- Create a webhook endpoint pointing to /api/stripe-webhook with the checkout.session.completed event. Paste the Webhook Secret in env.

4) Run locally
- npm install (in v0 this is inferred)
- npm run dev (or open Preview)
- Visit /products, /cart, /checkout, /account, /admin

## Project Structure

```text
ARWEAR-main/
├── app/
│   ├── account/
│   │   ├── page.tsx
│   │   └── section-client.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts
│   │   └── stripe-webhook/
│   │       └── route.ts
│   ├── cart/
│   │   └── page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   ├── products/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin-uploader.tsx
│   ├── ar-diagnostics.tsx
│   ├── ar-error-boundary.tsx
│   ├── ar-test.tsx
│   ├── footer.tsx
│   ├── header.tsx
│   ├── model-viewer-ar.tsx
│   ├── product-card.tsx
│   ├── product-list.tsx
│   ├── theme-provider.tsx
│   ├── try-on-component.tsx
│   └── ui/ (shadcn/ui components)
├── data/
│   └── seed-products.ts
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── stripe.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── public/
│   ├── assets/
│   │   └── 3d/
│   │       ├── baggy_pants_free.glb
│   │       ├── men_jacket.glb
│   │       ├── t-shirt (1).glb
│   │       ├── t-shirts_homme.glb
│   │       └── unisex_denim_shirt_design.glb
│   ├── images/
│   │   └── product-1.jpg … product-5.jpg
│   └── placeholder-*.{png,svg,jpg}
├── scripts/
│   ├── 001_schema.sql
│   └── 002_seed.sql
├── store/
│   └── cart-store.ts
├── types/
│   └── model-viewer.d.ts
├── AR-TRYON-FIXES-COMPLETE.md
├── AR-TRYON-TROUBLESHOOTING.md
├── FIXES-SUMMARY.md
├── FRONTEND-ENHANCEMENTS.md
├── README.md
├── SETUP-INSTRUCTIONS.md
├── database-schema.sql
├── global.d.ts
├── middleware.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
└── tsconfig.json
```

## AR: View at your home
- components/model-viewer-ar.tsx loads @google/model-viewer (Web Component) at runtime.
- Attributes:
  - ar, ar-modes="webxr scene-viewer quick-look", ar-placement="floor"
  - Basic scale and rotate UI. “Place on floor” sets floor placement.
- Fallback: 2D preview image always shown; Three.js fallback can be plugged in similarly if desired.

## Try-On (CV Skeleton)
- components/try-on-engine.tsx:
  - Requests camera permission, overlays a translucent garment area with adjustable anchor offsets.
  - Throttles drawing every N frames for performance.
  - Photo upload fallback applies the same overlay to a static image.
  - All processing stays local. No uploads unless you add code explicitly.
- TODO:
  - Integrate MediaPipe Pose landmarks and (optional) OpenCV.js to warp shirt/pants mesh or image.
  - Use Web Worker with OffscreenCanvas for heavier processing (see workers/pose-worker.ts as a starting point).

## Admin
- /admin:
  - Product CRUD (placeholder in-memory; wire to Supabase products table).
  - Upload GLB to Storage bucket "models" and preview to "previews".
  - Save anchor JSON in models_meta.
- Role check expects a public.users row with role='admin' and users.auth_user_id=auth.uid().

## Data Models (Future Implementation)
- MongoDB collections will include:
  - users: Authentication and role management
  - products: Product catalog with model references
  - models_meta: 3D model metadata and anchor points
  - orders: Order tracking and history

## Blender to Draco GLB
- Export GLTF Binary (.glb) in Blender:
  - Apply transforms, set +Y up if needed.
  - Enable compression (Draco) with quantization defaults.
- CLI conversion (install gltf-pipeline):
  - npx gltf-pipeline -i input.glb -o output.glb -d
  - Or use gltfpack:
  - npx gltfpack -i input.glb -o output.glb -cc

## Troubleshooting
- AR permissions: Ensure HTTPS and allow camera/motion. iOS requires Safari.
- CV accuracy: Good lighting, plain background, high-contrast garment edges.
- Model size: Use Draco compression and reduce texture sizes.
- CORS: Use public URLs from Supabase Storage; configure CORS on endpoints if serving from functions.

## Testing Plan (short)
Manual CV:
- Lighting: bright, dim; Background: plain, busy; Clothing colors: high vs. low contrast.
- Confirm overlay aligns roughly with shoulders (shirts) and hips/knees (pants) when offsets adjusted.

AR:
- iOS Safari: Quick Look activation.
- Android Chrome: WebXR and Scene Viewer activation.
- “Place on floor” behaves reasonably on flat surfaces.

Unit tests (examples):
- Product CRUD helpers (Supabase insert/update)
- Cart store math (totalCents)

## TODOs
- Wire Admin Product CRUD to Supabase.
- Persist Try-On anchor per product (models_meta linking).
- Add Three.js viewer as a non-AR fallback if needed.
- Replace seedProducts with live DB queries.
#
