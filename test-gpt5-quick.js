const OpenAI = require('openai');

async function quickTest() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Test with just 3 tasks
  const tasks = [
    'Conduct market research',
    'Create marketing materials',
    'Analyze competitor activities'
  ];

  const prompt = `For each task, suggest 1 FREE resource per category (quick_wins, certifications, deepening).

EXCLUDE: NO Udemy, NO Coursera

TASKS:
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

OUTPUT JSON:
{
  "task": {
    "quick_wins": [{"label": "...", "url": "https://..."}],
    "certifications": [{"label": "...", "url": "https://..."}],
    "deepening": [{"label": "...", "url": "https://..."}]
  }
}`;

  console.log('Testing GPT-5-mini with 3 tasks, 8000 tokens...\n');

  const start = Date.now();
  const response = await client.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: 'Return only valid JSON. Never recommend Udemy or Coursera.' },
      { role: 'user', content: prompt }
    ],
    max_completion_tokens: 8000,
    response_format: { type: "json_object" }
  });

  const duration = (Date.now() - start) / 1000;

  console.log(`Duration: ${duration}s`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`Content length: ${response.choices[0].message.content?.length}`);
  console.log(`Completion tokens: ${response.usage?.completion_tokens}`);
  console.log(`\nContent preview:\n${response.choices[0].message.content?.substring(0, 500)}...\n`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('❌ TRUNCATED!');
  } else {
    console.log('✅ SUCCESS!');
  }
}

quickTest().catch(console.error);
