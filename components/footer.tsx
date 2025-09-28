import Link from "next/link"
import { Sparkles, Github, Twitter, Instagram, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 mt-0">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                AR Fashion
              </span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              Experience the future of online shopping with cutting-edge AR technology. 
              Try on clothes virtually and shop with confidence.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-slate-300" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-slate-300" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5 text-slate-300" />
              </a>
              <a 
                href="mailto:hello@arfashion.com" 
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5 text-slate-300" />
              </a>
            </div>
          </div>
          
          {/* Products Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-slate-300 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-slate-300 hover:text-white transition-colors">
                  Shirts
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-slate-300 hover:text-white transition-colors">
                  Pants
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-slate-300 hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="text-slate-300 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <a href="https://stripe.com/docs/testing" className="text-slate-300 hover:text-white transition-colors" target="_blank" rel="noreferrer">
                  Demo Payment
                </a>
              </li>
              <li>
                <a href="https://vercel.com/help" className="text-slate-300 hover:text-white transition-colors" target="_blank" rel="noreferrer">
                  Support
                </a>
              </li>
              <li>
                <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-slate-800 my-8" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} AR Fashion. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-500">
              Made with ❤️ for the future of shopping
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
