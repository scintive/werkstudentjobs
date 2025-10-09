#!/usr/bin/env node

/**
 * Scrape company About page and extract rich information
 * Usage: node tools/scrape-company-about.js "Company Name"
 */

const https = require('https');
const http = require('http');

/**
 * Fetch URL and extract body content
 */
async function fetchPageBody(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Extract body content - strip HTML tags but keep text
        const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (!bodyMatch) {
          return reject(new Error('No body tag found'));
        }

        let bodyContent = bodyMatch[1];

        // Remove script tags and their content
        bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove style tags and their content
        bodyContent = bodyContent.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // Remove all HTML tags
        bodyContent = bodyContent.replace(/<[^>]+>/g, ' ');

        // Decode HTML entities
        bodyContent = bodyContent
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        // Clean up whitespace
        bodyContent = bodyContent
          .replace(/\s+/g, ' ')
          .trim();

        // Limit to reasonable size (10000 chars for GPT)
        if (bodyContent.length > 10000) {
          bodyContent = bodyContent.substring(0, 10000) + '...';
        }

        resolve(bodyContent);
      });
    }).on('error', reject);
  });
}

/**
 * Search for company website using Tavily
 */
async function findCompanyWebsite(companyName) {
  const API_KEY = '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';

  const searchQuery = `${companyName} official website`;

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      query: searchQuery,
      max_results: 3,
      include_answer: false,
      include_raw_content: false,
      search_depth: 'basic'
    })
  });

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('No search results found');
  }

  return data.results;
}

/**
 * Parse company info using GPT-3.5
 */
async function parseCompanyInfo(bodyContent, companyName) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const prompt = `Extract comprehensive company information from the following About page content for "${companyName}".

Content:
${bodyContent}

Return JSON with MAXIMUM DETAIL:
{
  "company_name": "${companyName}",
  "website": "official website URL or null",
  "logo_url": "company logo URL or null",
  "headquarters": "city only or null",
  "founded": year as number or null,
  "employee_count": "exact number or range or null",
  "industry": "industry sector or null",
  "description": "concise description (max 300 chars) or null",
  "business_model": "how company makes money or null",
  "products_services": ["array of main products/services"] or null,
  "leadership_team": ["CEO: Name", "CTO: Name"] or null,
  "company_values": ["core company values"] or null,
  "culture_highlights": ["work culture highlights"] or null,
  "remote_work_policy": "remote work policy description or null",
  "diversity_initiatives": ["diversity programs"] or null,
  "awards_recognition": ["awards, certifications"] or null,
  "recent_news": ["recent developments"] or null,
  "competitors": ["main competitors"] or null,
  "glassdoor_rating": "rating as string or null",
  "office_locations": ["city names only"] or null,
  "additional_insights": ["key insights"] or null
}

Only include information explicitly in the content. Use null for missing data.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a company research assistant. Extract structured information from About pages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('No response from GPT');
  }

  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

/**
 * Main function
 */
async function main() {
  const companyName = process.argv[2];

  if (!companyName) {
    console.error('Usage: node tools/scrape-company-about.js "Company Name"');
    process.exit(1);
  }

  console.log(`🔍 Searching for ${companyName}...`);

  try {
    // 1. Find company website
    const searchResults = await findCompanyWebsite(companyName);
    console.log(`✅ Found ${searchResults.length} results`);

    // 2. Try to scrape About pages
    const aboutUrls = [];
    for (const result of searchResults) {
      const baseUrl = result.url.split('/').slice(0, 3).join('/');
      aboutUrls.push(
        `${baseUrl}/about`,
        `${baseUrl}/about-us`,
        `${baseUrl}/company`,
        `${baseUrl}/who-we-are`,
        result.url
      );
    }

    let bodyContent = null;
    let successUrl = null;

    for (const url of aboutUrls) {
      try {
        console.log(`📄 Trying: ${url}`);
        bodyContent = await fetchPageBody(url);
        successUrl = url;
        console.log(`✅ Successfully scraped: ${url} (${bodyContent.length} chars)`);
        break;
      } catch (err) {
        // Try next URL
      }
    }

    if (!bodyContent) {
      throw new Error('Could not scrape any About page');
    }

    // 3. Parse with GPT
    console.log(`🤖 Parsing with GPT-3.5...`);
    const companyInfo = await parseCompanyInfo(bodyContent, companyName);

    // 4. Output results
    console.log('\n✅ EXTRACTED COMPANY INFO:');
    console.log(JSON.stringify(companyInfo, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
