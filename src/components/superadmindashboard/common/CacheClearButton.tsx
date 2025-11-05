'use client'

import { useState } from 'react'

export default function CacheClearButton() {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCache = async () => {
    if (!confirm('ნამდვილად გსურთ მთელი საიტის კეშის გასუფთავება? ეს შეანელებს საიტს დროებით ყველა მომხმარებლისთვის.')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN,
          path: '/', // Revalidate entire site
        }),
      })

      const data = await response.json()

      if (data.revalidated) {
        alert('✅ საიტის კეში წარმატებით გასუფთავდა! ყველა გვერდი განახლდება.')
      } else {
        throw new Error(data.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      alert('❌ შეცდომა კეშის გასუფთავებისას: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <button
      onClick={handleClearCache}
      disabled={isClearing}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isClearing ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          კეში იწმინდება...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          საიტის კეშის გასუფთავება
        </>
      )}
    </button>
  )
}
