import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Use regular client - get_shared_document has SECURITY DEFINER
    const supabase = createServerSupabase(request)

    // Use the database function to get shared document
    const { data, error } = await supabase
      .rpc('get_shared_document', { p_token: token } as never)

    if (error) {
      console.error('Error fetching shared document:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shared document' },
        { status: 500 }
      )
    }

    const shareRecords = data as unknown[] | null;

    if (!shareRecords || shareRecords.length === 0) {
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      )
    }

    const shareData = shareRecords[0] as Record<string, unknown>;

    // Check if expired
    if (shareData.is_expired) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 }
      )
    }

    // Increment view count
    await supabase.rpc('increment_share_view_count', { p_token: token } as never)

    // Parse resume data
    let resumeData = null
    if (shareData.resume_data) {
      resumeData = shareData.resume_data
    } else if (shareData.variant_data) {
      const variantData = shareData.variant_data as Record<string, unknown>;
      if (variantData.tailored_data) {
        resumeData = variantData.tailored_data
      }
    }

    // For cover letters, extract from variant data
    let coverLetterData = null
    if (shareData.share_type === 'cover_letter' && shareData.variant_data) {
      const variantData = shareData.variant_data as Record<string, unknown>;
      // Parse cover_letter_content JSON
      const coverLetterContent = variantData.cover_letter_content
      if (coverLetterContent) {
        try {
          const parsed = typeof coverLetterContent === 'string'
            ? JSON.parse(coverLetterContent)
            : coverLetterContent

          const parsedData = parsed as Record<string, unknown>;
          const currentVersion = parsedData.current_version || 1
          const versions = parsedData.versions as unknown[] | undefined;
          const version = versions?.find(v => {
            const versionData = v as Record<string, unknown>;
            return versionData.version === currentVersion;
          }) as Record<string, unknown> | undefined;

          if (version?.cover_letter) {
            coverLetterData = version.cover_letter
          }
          console.log('📧 Extracted cover letter data:', coverLetterData)
        } catch (e) {
          console.error('Error parsing cover letter content:', e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      shareType: shareData.share_type,
      template: shareData.template,
      resumeData,
      coverLetterData
    })

  } catch (error) {
    console.error('Error in share token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
