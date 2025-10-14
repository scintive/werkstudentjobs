const OpenAI = require('openai');

async function testModels() {
  const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey });

  const models = ['gpt-5-mini', 'gpt-4o-mini', 'gpt-4o'];
  
  for (const model of models) {
    console.log(`\n🧪 Testing model: ${model}`);
    try {
      const response = await Promise.race([
        client.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: 'Say "test"' }],
          max_completion_tokens: 10
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      console.log(`✅ ${model} works!`);
    } catch (error) {
      console.log(`❌ ${model} failed:`, error.message.substring(0, 100));
    }
  }
}

testModels();
