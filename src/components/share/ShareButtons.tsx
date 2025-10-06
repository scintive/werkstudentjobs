'use client'

import { useState } from 'react'
import { Copy, Share2, Check, Loader2, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareButtonsProps {
  shareType: 'resume' | 'cover_letter'
  resumeId?: string
  variantId?: string
  template?: string
  className?: string
}

export function ShareButtons({
  shareType,
  resumeId,
  variantId,
  template,
  className = ''
}: ShareButtonsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateShareLink = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shareType,
          resumeId,
          variantId,
          template,
          expiresInDays: null // No expiration
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate share link')
      }

      const data = await response.json()
      setShareUrl(data.shareUrl)

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

    } catch (err) {
      console.error('Error generating share link:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate link')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    // First ensure we have a share URL
    if (!shareUrl) {
      await generateShareLink()
      // After generating, the URL will be auto-copied
      return
    }

    // Use native share if available (mainly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${shareType === 'resume' ? 'Resume' : 'Cover Letter'}`,
          url: shareUrl
        })
      } catch (err) {
        // User cancelled or share failed, just copy instead
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard()
        }
      }
    } else {
      // Desktop fallback - just copy to clipboard with feedback
      copyToClipboard()
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Copy Link Button */}
      <button
        onClick={shareUrl ? copyToClipboard : generateShareLink}
        disabled={isGenerating}
        className={cn(
          'h-9 px-4 flex items-center gap-2 rounded-lg border font-medium transition-all duration-200',
          isGenerating
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : copied
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating...</span>
          </>
        ) : copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span className="text-sm">Copy Link</span>
          </>
        )}
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className={cn(
          'h-9 px-4 flex items-center gap-2 rounded-lg border font-medium transition-all duration-200',
          isGenerating
            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
        )}
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm">Share</span>
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
