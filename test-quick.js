const OpenAI = require('openai');

async function quickTest() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `For each task, suggest 1 FREE resource per category.

EXCLUDE: NO Udemy, NO Coursera

TASKS:
1. Conduct market research
2. Create marketing materials
3. Analyze competitors

OUTPUT JSON:
{
  "Conduct market research": {
    "quick_wins": [{"label": "...", "url": "https://..."}],
    "certifications": [{"label": "...", "url": "https://..."}],
    "deepening": [{"label": "...", "url": "https://..."}]
  }
}`;

  console.log('Testing GPT-5-mini with 3 tasks...\n');

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

  console.log('Duration:', duration, 's');
  console.log('Finish reason:', response.choices[0].finish_reason);
  console.log('Content length:', response.choices[0].message.content?.length);
  console.log('Completion tokens:', response.usage?.completion_tokens);
  console.log('\nFull response:');
  console.log(response.choices[0].message.content);

  if (response.choices[0].finish_reason === 'length') {
    console.error('\n❌ TRUNCATED!');
  } else {
    console.log('\n✅ SUCCESS!');
  }
}

quickTest().catch(err => console.error('Error:', err.message));
