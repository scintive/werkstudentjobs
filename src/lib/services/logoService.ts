/**
 * Logo Service - Fetch company logos from various sources
 * Priority: Logo.dev (Clearbit replacement) → Clearbit (deprecated Dec 2025) → Google Favicons
 */

/**
 * Fetch company logo using multiple fallback strategies
 */
export async function fetchCompanyLogo(companyName: string, websiteUrl?: string | null): Promise<string | null> {
  try {
    // Extract domain from website URL if available
    let domain: string | null = null;

    if (websiteUrl) {
      try {
        const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
        domain = url.hostname.replace('www.', '');
      } catch {
        // Invalid URL, continue without domain
      }
    }

    // Strategy 1: Logo.dev API (free, official Clearbit replacement, high quality)
    if (domain) {
      const logoDevUrl = `https://img.logo.dev/${domain}?token=pk_X-1ZO13XSVaRE1Nw1hg0tQ&format=png&size=200`;
      const isLogoDevValid = await checkImageUrl(logoDevUrl);
      if (isLogoDevValid) {
        console.log(`✅ Logo.dev: Found logo for ${companyName}`);
        return logoDevUrl;
      }
    }

    // Strategy 2: Clearbit Logo API (free, no auth, being deprecated Dec 2025)
    if (domain) {
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      const isClearbitValid = await checkImageUrl(clearbitUrl);
      if (isClearbitValid) {
        console.log(`✅ Clearbit: Found logo for ${companyName}`);
        return clearbitUrl;
      }
    }

    // Strategy 3: Google Favicon Service (reliable, always works but lower quality)
    if (domain) {
      // Use Google's high-res favicon service (128px)
      const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      console.log(`⚠️ Fallback to Google Favicons for ${companyName}`);
      return googleUrl; // Google always returns something, even if generic
    }

    // Strategy 4: Direct favicon from company domain
    if (domain) {
      const faviconUrl = `https://${domain}/favicon.ico`;
      const isFaviconValid = await checkImageUrl(faviconUrl);
      if (isFaviconValid) {
        console.log(`✅ Direct favicon: Found for ${companyName}`);
        return faviconUrl;
      }
    }

    console.log(`❌ No logo found for ${companyName}`);
    return null;
  } catch (error) {
    console.error('Error fetching company logo:', error);
    return null;
  }
}

/**
 * Check if an image URL is valid and accessible
 */
async function checkImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    return !!response.ok && !!response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Get logo URL with caching (for use in API routes)
 */
export async function getCompanyLogoWithCache(
  companyName: string,
  websiteUrl?: string | null
): Promise<string | null> {
  // In production, you might want to cache this in a database or Redis
  // For now, we'll just fetch directly
  return fetchCompanyLogo(companyName, websiteUrl);
}
