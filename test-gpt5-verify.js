// Test GPT-5 with URL verification and Udemy/Coursera filtering
const OpenAI = require('openai');

async function verifyUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeout);

    const isValid = response.ok;
    console.log(`🔗 ${url} - ${isValid ? '✅ Valid' : `❌ Invalid (${response.status})`}`);
    return isValid;
  } catch (error) {
    console.log(`🔗 ${url} - ❌ Failed (${error.message})`);
    return false;
  }
}

async function testGPT5WithVerification() {
  const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey });

  const tasks = [
    { task: 'Build WordPress websites' },
    { task: 'Create video content for social media' }
  ];

  const prompt = `For each job responsibility below, suggest EXACTLY 1 best FREE learning resource per category (quick_wins, certifications, deepening). Just the #1 most valuable resource - nothing more.

INCLUDE (diverse resource types):
- Official documentation & guides
- Interactive coding platforms (CodePen, Replit, StackBlitz)
- YouTube tutorials from verified channels
- GitHub repositories with examples
- Free courses from freeCodeCamp, Codecademy (free tier), edX (audit)
- Interactive learning tools
- Technical blog posts from experts
- Open-source books

STRICTLY EXCLUDE:
- NO Udemy links
- NO Coursera links
- NO paid courses
- NO dead/404 links

RULES:
- 100% FREE and accessible
- VERIFIED working URLs only
- EXACT match to responsibility
- Diverse resource types (not just tutorials)
- Prefer official sources and well-known platforms

OUTPUT JSON - EXACTLY 1 resource per category:
{
  "task": {
    "quick_wins": [{"label": "Quick Start Resource", "url": "https://..."}],
    "certifications": [{"label": "Free Certification", "url": "https://..."}],
    "deepening": [{"label": "Deep Learning Resource", "url": "https://..."}]
  }
}

RESPONSIBILITIES:
${tasks.map((t, i) => `${i + 1}. ${t.task}`).join('\n')}`;

  try {
    console.log('\n🤖 Testing GPT-5-mini with URL verification...\n');

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{
        role: 'system',
        content: 'You are an expert learning resource curator specializing in finding the best free educational content from diverse sources. You NEVER recommend Udemy or Coursera. You only recommend resources you are confident are active and valuable. Prioritize official documentation, interactive platforms, and well-established free resources. Return responses in valid JSON format only.'
      }, {
        role: 'user',
        content: prompt
      }],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const learningPaths = JSON.parse(response.choices[0].message.content || '{}');
    console.log('\n📚 Generated Learning Paths:\n');

    // Verify all URLs
    console.log('\n🔍 Verifying URLs...\n');
    const verifiedPaths = {};

    for (const [task, categories] of Object.entries(learningPaths)) {
      console.log(`\n📋 Task: ${task}`);
      verifiedPaths[task] = {
        quick_wins: [],
        certifications: [],
        deepening: []
      };

      // Verify quick_wins
      for (const resource of categories.quick_wins || []) {
        const url = resource.url?.toLowerCase() || '';

        // Check for banned platforms
        if (url.includes('udemy.com') || url.includes('coursera.org')) {
          console.log(`🚫 Filtered: ${resource.label} (banned platform)`);
          continue;
        }

        // Verify URL
        const isValid = await verifyUrl(resource.url);
        if (isValid) {
          verifiedPaths[task].quick_wins.push(resource);
          console.log(`  ✅ Quick Win: ${resource.label}`);
        } else {
          console.log(`  ❌ Rejected: ${resource.label}`);
        }
      }

      // Verify certifications
      for (const resource of categories.certifications || []) {
        const url = resource.url?.toLowerCase() || '';

        if (url.includes('udemy.com') || url.includes('coursera.org')) {
          console.log(`🚫 Filtered: ${resource.label} (banned platform)`);
          continue;
        }

        const isValid = await verifyUrl(resource.url);
        if (isValid) {
          verifiedPaths[task].certifications.push(resource);
          console.log(`  ✅ Certification: ${resource.label}`);
        } else {
          console.log(`  ❌ Rejected: ${resource.label}`);
        }
      }

      // Verify deepening
      for (const resource of categories.deepening || []) {
        const url = resource.url?.toLowerCase() || '';

        if (url.includes('udemy.com') || url.includes('coursera.org')) {
          console.log(`🚫 Filtered: ${resource.label} (banned platform)`);
          continue;
        }

        const isValid = await verifyUrl(resource.url);
        if (isValid) {
          verifiedPaths[task].deepening.push(resource);
          console.log(`  ✅ Deepening: ${resource.label}`);
        } else {
          console.log(`  ❌ Rejected: ${resource.label}`);
        }
      }
    }

    console.log('\n\n✅ Verification Complete!\n');
    console.log('📊 Final Verified Paths:\n');
    console.log(JSON.stringify(verifiedPaths, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testGPT5WithVerification();
