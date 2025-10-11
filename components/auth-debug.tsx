"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AuthDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, checkAuth } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const refreshAuth = async () => {
    setRefreshing(true)
    await checkAuth()
    setRefreshing(false)
  }

  const clearCookies = () => {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })
    alert("Cookies cleared! Please refresh the page.")
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-red-800 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs border border-red-600 shadow-lg"
      >
        🐛 Auth Debug
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Auth Debug Panel</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Loading:</span>
            <span className={`font-medium ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
              {loading ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">User Authenticated:</span>
            <span className={`font-medium ${user ? 'text-green-400' : 'text-red-400'}`}>
              {user ? 'Yes' : 'No'}
            </span>
          </div>

          {user && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-300">User ID:</span>
                <span className="text-white font-medium">{user.id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-300">Name:</span>
                <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-300">Email:</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <span className="text-slate-300">Current URL:</span>
            <span className="text-white font-medium text-xs break-all">
              {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">User Agent:</span>
            <span className="text-white font-medium text-xs break-all">
              {typeof navigator !== 'undefined' ? (
                /Mobile|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
              ) : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-300">Cookies:</span>
            <span className="text-white font-medium text-xs">
              {typeof document !== 'undefined' ? 
                (document.cookie ? 'Present' : 'None') : 'N/A'
              }
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={refreshAuth}
            disabled={refreshing}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Auth Status'}
          </button>

          <button
            onClick={clearCookies}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Clear All Cookies
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
          >
            Reload Page
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
          >
            Close
          </button>
        </div>

        <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded text-xs">
          <p className="text-slate-300 mb-2"><strong>Troubleshooting:</strong></p>
          <ul className="text-slate-400 space-y-1">
            <li>• If "Loading" stuck: Refresh auth status</li>
            <li>• If auth fails: Clear cookies and sign in again</li>
            <li>• If redirected to sign-in: Check middleware settings</li>
            <li>• Mobile issues: Check browser console</li>
          </ul>
        </div>
      </div>
    </div>
  )
}