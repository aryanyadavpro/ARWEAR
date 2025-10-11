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
        // Apply headers to all GLB files
        source: '/assets/3d/:path*.glb',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Content-Type',
            value: 'model/gltf-binary',
          },
        ],
      },
      {
        // Apply headers to all files in public directory
        source: '/(.*).(glb|gltf)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        // Security headers for AR features
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, geolocation=*, gyroscope=*, magnetometer=*, accelerometer=*',
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
