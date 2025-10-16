/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add headers for AR assets and CORS
  async headers() {
    return [
      {
        // Apply headers to all assets in /public/assets/3d (CORS + CORP)
        source: '/assets/3d/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          // Let Next set the correct Content-Type; we override only for .glb below
        ],
      },
      {
        // .glb files anywhere (explicit Content-Type for some CDNs/hosts)
        source: '/:all*(.glb)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Content-Type', value: 'model/gltf-binary' },
        ],
      },
      {
        // .gltf files anywhere (let's be explicit too)
        source: '/:all*(.gltf)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Content-Type', value: 'model/gltf+json' },
        ],
      },
      {
        // Security headers for AR features
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value:
              'camera=*, microphone=*, geolocation=(), gyroscope=*, magnetometer=*, accelerometer=*',
          },
        ],
      },
    ]
  },
  // Experimental features for better AR support
  experimental: {
    esmExternals: 'loose',
  },
}

export default nextConfig
