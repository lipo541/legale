// ==================== useShareHandler Hook ====================
// Handles social sharing functionality with Web Share API fallback

import { useCallback } from 'react'
import type { SharePlatform } from '../types'

interface ShareData {
  title: string
  description?: string
  url?: string
}

interface UseShareHandlerReturn {
  handleShare: (platform: SharePlatform, data: ShareData) => Promise<void>
  getShareUrl: (platform: SharePlatform, url: string, title: string) => string
}

export function useShareHandler(): UseShareHandlerReturn {
  const getShareUrl = useCallback((platform: SharePlatform, url: string, title: string): string => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    
    const shareUrls: Record<SharePlatform, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    }
    
    return shareUrls[platform]
  }, [])

  const handleShare = useCallback(async (platform: SharePlatform, data: ShareData): Promise<void> => {
    const url = data.url || (typeof window !== 'undefined' ? window.location.href : '')
    const title = data.title
    const description = data.description || ''

    // Check if Web Share API is supported (mobile devices)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
        return // Success - native share dialog shown
      } catch (err: unknown) {
        // User cancelled or error - fall back to URL method
        if (err instanceof Error && err.name === 'AbortError') {
          return // User cancelled, don't open fallback
        }
      }
    }

    // Fallback for desktop or if Web Share API not supported
    const shareUrl = getShareUrl(platform, url, title)
    window.open(shareUrl, '_blank', 'width=600,height=500,noopener,noreferrer')
  }, [getShareUrl])

  return { handleShare, getShareUrl }
}

export default useShareHandler
