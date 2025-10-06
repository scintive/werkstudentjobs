'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SharePage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [shareType, setShareType] = useState<string>('')
  const [iframeHeight, setIframeHeight] = useState<string>('1400px')

  useEffect(() => {
    async function loadSharedDocument() {
      try {
        // Fetch the shared document data
        const response = await fetch(`/api/share/${token}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load shared document')
        }

        const data = await response.json()
        console.log('📧 Share data:', data)
        setShareType(data.shareType)

        // If it's a resume, render it
        if (data.shareType === 'resume') {
          const previewResponse = await fetch('/api/resume/preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              resumeData: data.resumeData,
              template: data.template || 'swiss'
            })
          })

          if (!previewResponse.ok) {
            throw new Error('Failed to render resume')
          }

          // The preview API returns JSON with {success, html}
          const previewData = await previewResponse.json()
          const html = previewData.html || previewData
          setHtmlContent(html)
          setIframeHeight('1400px') // Resume height
        } else if (data.shareType === 'cover_letter') {
          // For cover letters, format the content properly
          console.log('📧 Cover letter data:', data.coverLetterData)
          const content = data.coverLetterData?.content
          console.log('📧 Content:', content)
          if (!content) {
            throw new Error('Cover letter content not found')
          }

          const coverLetterHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Cover Letter</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  height: auto;
                  min-height: 100%;
                }
                body {
                  font-family: 'Georgia', 'Times New Roman', serif;
                  max-width: 650px;
                  margin: 0 auto;
                  padding: 40px;
                  line-height: 1.7;
                  color: #1f2937;
                  background: white;
                }
                .subject {
                  font-size: 15px;
                  font-weight: 600;
                  margin-bottom: 24px;
                  color: #111827;
                  line-height: 1.4;
                }
                .salutation {
                  margin-bottom: 20px;
                  font-size: 14px;
                }
                .paragraph {
                  margin-bottom: 16px;
                  font-size: 14px;
                  text-align: justify;
                  line-height: 1.7;
                }
                .closing {
                  margin-top: 20px;
                  margin-bottom: 6px;
                  font-size: 14px;
                }
                .sign-off {
                  margin-top: 32px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              ${content.subject ? `<div class="subject">${content.subject}</div>` : ''}
              <div class="salutation">${content.salutation || 'Dear Hiring Manager'},</div>
              ${content.intro ? `<div class="paragraph">${content.intro}</div>` : ''}
              ${content.body_paragraphs ? content.body_paragraphs.map((p: string) => `<div class="paragraph">${p}</div>`).join('') : ''}
              ${content.closing ? `<div class="closing">${content.closing}</div>` : ''}
              <div class="sign-off">${content.sign_off || 'Best regards'}</div>
            </body>
            </html>
          `
          setHtmlContent(coverLetterHtml)
          setIframeHeight('800px') // Cover letter height (shorter)
        }

      } catch (err) {
        console.error('Error loading shared document:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadSharedDocument()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shared document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Unable to Load Document
            </h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      {/* Paper-like container */}
      <div className="max-w-[900px] mx-auto px-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Document preview iframe */}
          <iframe
            srcDoc={htmlContent}
            className="w-full border-0"
            style={{ height: iframeHeight }}
            title="Shared Document"
          />
        </div>

        {/* Powered by footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          {shareType === 'resume' ? 'Resume' : 'Cover Letter'} shared via <span className="font-semibold">WerkstudentJobs</span>
        </div>
      </div>
    </div>
  )
}
