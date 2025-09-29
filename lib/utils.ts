import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency helpers
export const USD_TO_INR_RATE = 83 // approximate; adjust as needed

export function formatInrFromUsdCents(usdCents: number): string {
  const usd = usdCents / 100
  const inr = usd * USD_TO_INR_RATE
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr)
}

export function convertUsdCentsToInrPaise(usdCents: number): number {
  const usd = usdCents / 100
  const inr = usd * USD_TO_INR_RATE
  // Stripe expects the smallest currency unit (paise)
  return Math.round(inr * 100)
}
