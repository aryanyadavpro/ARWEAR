import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Suspense } from "react"

// Centralized site-wide metadata
export const metadata: Metadata = {
  title: "AR Fashion - Virtual Try-On & Augmented Reality Shopping",
  description: "Experience the future of fashion with AR Fashion. Try on clothes virtually, place 3D models in your space, and shop with confidence using cutting-edge AR technology.",
  keywords: ["AR fashion", "virtual try-on", "augmented reality", "3D clothing", "online shopping", "AR technology"],
  authors: [{ name: "AR Fashion Team" }],
  creator: "AR Fashion",
  publisher: "AR Fashion",
  // Set metadataBase for absolute social image/URL resolution in production
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AR Fashion - Virtual Try-On & Augmented Reality Shopping",
    description: "Experience the future of fashion with cutting-edge AR technology. Try on clothes virtually and shop with confidence.",
    url: "/",
    siteName: "AR Fashion",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AR Fashion - Virtual Try-On & Augmented Reality Shopping",
    description: "Experience the future of fashion with cutting-edge AR technology. Try on clothes virtually and shop with confidence.",
    images: ["/og-image.jpg"],
  },
}

// Next.js 14: move viewport and themeColor to dedicated export
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e293b" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-slate-900 text-white antialiased`}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
