// Test GPT-5 with production settings (8000 tokens, 11 tasks)
const OpenAI = require('openai');

async function testProductionScenario() {
  const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey });

  // Simulate 11 real job tasks (from production logs)
  const tasks = [
    { task: 'Conduct and analyze market research to identify innovative growth opportunities' },
    { task: 'Support the Product Marketing team in creating compelling marketing materials' },
    { task: 'Assist in developing go-to-market strategies for new product launches' },
    { task: 'Collaborate with cross-functional teams to align marketing initiatives' },
    { task: 'Analyze competitor activities and market trends' },
    { task: 'Support content creation for various marketing channels' },
    { task: 'Assist in organizing and executing marketing events and campaigns' },
    { task: 'Help maintain and update marketing databases and CRM systems' },
    { task: 'Contribute to social media marketing efforts' },
    { task: 'Support customer research and feedback analysis' },
    { task: 'Assist in measuring and reporting on marketing campaign effectiveness' }
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

  console.log('\n🧪 PRODUCTION TEST: GPT-5-mini with 11 tasks, 8000 tokens\n');
  console.log('📋 Tasks:', tasks.length);
  console.log('📏 Prompt length:', prompt.length, 'characters\n');

  try {
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{
        role: 'system',
        content: 'You are an expert learning resource curator specializing in finding the best free educational content from diverse sources. You NEVER recommend Udemy or Coursera. You only recommend resources you are confident are active and valuable. Prioritize official documentation, interactive platforms, and well-established free resources. Return responses in valid JSON format only.'
      }, {
        role: 'user',
        content: prompt
      }],
      max_completion_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const duration = Date.now() - startTime;

    console.log('⏱️  Duration:', (duration / 1000).toFixed(2), 'seconds');
    console.log('📊 Finish reason:', response.choices[0].finish_reason);
    console.log('📏 Content length:', response.choices[0].message.content?.length || 0);
    console.log('💰 Usage:', response.usage);

    // Check if response was truncated
    if (response.choices[0].finish_reason === 'length') {
      console.error('\n❌ RESPONSE TRUNCATED! Need more tokens!\n');
      console.error('Partial content:', response.choices[0].message.content?.substring(0, 200));
      return;
    }

    // Parse and analyze
    const content = response.choices[0].message.content || '{}';
    const learningPaths = JSON.parse(content);

    console.log('\n✅ SUCCESS! Full response received\n');
    console.log('📚 Learning paths generated:', Object.keys(learningPaths).length);

    // Show sample
    const firstTask = Object.keys(learningPaths)[0];
    if (firstTask) {
      console.log('\n📖 Sample task:', firstTask);
      console.log('Resources:', JSON.stringify(learningPaths[firstTask], null, 2));
    }

    // Check for Udemy/Coursera
    let bannedCount = 0;
    for (const [task, categories] of Object.entries(learningPaths)) {
      for (const category of Object.values(categories)) {
        if (Array.isArray(category)) {
          for (const resource of category) {
            const url = resource.url?.toLowerCase() || '';
            if (url.includes('udemy.com') || url.includes('coursera.org')) {
              bannedCount++;
              console.log('🚫 Found banned platform:', resource.url);
            }
          }
        }
      }
    }

    console.log('\n📊 Statistics:');
    console.log('  - Total tasks:', tasks.length);
    console.log('  - Tasks with paths:', Object.keys(learningPaths).length);
    console.log('  - Banned platforms found:', bannedCount);
    console.log('  - Response tokens:', response.usage?.completion_tokens);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testProductionScenario();
