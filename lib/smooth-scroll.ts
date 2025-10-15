/**
 * Smooth scroll utility functions for navigation
 */

export function smoothScrollToSection(sectionId: string, offset: number = 80) {
  const element = document.getElementById(sectionId)
  
  if (!element) {
    console.warn(`Section with id "${sectionId}" not found`)
    return
  }

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })
}

export function handleSmoothScroll(href: string, callback?: () => void) {
  // Check if it's a hash link to a section on the same page
  if (href.startsWith('#')) {
    const sectionId = href.substring(1)
    smoothScrollToSection(sectionId)
    if (callback) callback()
    return true
  }
  
  // Check if it's a same-domain link with a hash
  if (href.includes('#')) {
    const [path, hash] = href.split('#')
    
    // If we're on the home page or going to the home page
    if (path === '/' || path === '' || window.location.pathname === '/') {
      if (window.location.pathname !== '/') {
        // Navigate to home page first, then scroll
        window.location.href = href
        return true
      } else {
        // Already on home page, just scroll
        smoothScrollToSection(hash)
        if (callback) callback()
        return true
      }
    }
  }
  
  // Special handling for /products - check if we're on home page and should scroll to products section
  if (href === '/products' && window.location.pathname === '/') {
    const productsSection = document.getElementById('products')
    if (productsSection) {
      smoothScrollToSection('products')
      if (callback) callback()
      return true
    }
  }
  
  return false // Let normal navigation handle this
}
