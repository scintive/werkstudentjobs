// Test script to verify GPT-5 learning path generation
const OpenAI = require('openai');

async function testGPT5LearningPaths() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found');
    return;
  }

  console.log('✅ OpenAI API key present:', apiKey.substring(0, 10) + '...');

  const client = new OpenAI({ apiKey });

  const tasks = [
    { task: 'Develop RESTful APIs using Node.js and Express' },
    { task: 'Design and implement PostgreSQL database schemas' }
  ];

  const prompt = `For each job responsibility below, suggest EXACTLY 1 best FREE learning resource per category (quick_wins, certifications, deepening). Just the #1 most valuable resource - nothing more.

INCLUDE:
- Official docs, expert tutorials, YouTube, free courses (audit), GitHub repos, interactive tools

RULES:
- 100% FREE
- WORKING URLs
- EXACT match to responsibility
- Hands-on learning

OUTPUT JSON - EXACTLY 1 resource per category:
{
  "task": {
    "quick_wins": [{"label": "Quick Start Guide", "url": "https://..."}],
    "certifications": [{"label": "Certification Name", "url": "https://..."}],
    "deepening": [{"label": "Deep Dive Resource", "url": "https://..."}]
  }
}

RESPONSIBILITIES:
${tasks.map((t, i) => `${i + 1}. ${t.task}`).join('\n')}`;

  try {
    console.log('\n🤖 Testing GPT-5-mini learning path generation...');
    console.log('📋 Tasks:', tasks.length);

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{
        role: 'system',
        content: 'You are an expert learning resource curator specializing in finding the best free educational content. You only recommend resources you are confident are accurate, active, and valuable. Return responses in valid JSON format only.'
      }, {
        role: 'user',
        content: prompt
      }],
      max_completion_tokens: 4000,
      // GPT-5-mini only supports default temperature (1)
      response_format: { type: "json_object" }
    });

    console.log('\n✅ GPT-5 Response received!');
    console.log('📊 Finish reason:', response.choices[0].finish_reason);
    console.log('📏 Content length:', response.choices[0].message.content?.length);

    const learningPaths = JSON.parse(response.choices[0].message.content || '{}');
    console.log('\n📚 Learning Paths Generated:');
    console.log(JSON.stringify(learningPaths, null, 2));

    console.log('\n🎯 Summary:');
    console.log('  - Tasks with learning paths:', Object.keys(learningPaths).length);
    console.log('  - Using GPT-5-mini model');
    console.log('  - Structured JSON output enforced');

  } catch (error) {
    console.error('\n❌ GPT-5 Error:', error.message);
    if (error.response) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

testGPT5LearningPaths();
