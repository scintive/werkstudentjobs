const fetch = require('node-fetch');

async function testSuggestions() {
  console.log('🧪 Testing suggestion creation...');
  
  // Get Maria's auth token
  const authResponse = await fetch('http://localhost:3000/api/auth/test-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@maria.be' })
  });
  
  const { token } = await authResponse.json();
  console.log('✅ Got auth token');
  
  // Get Maria's latest resume
  const resumeResponse = await fetch('http://localhost:3000/api/profile/latest', {
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { resumeData } = await resumeResponse.json();
  console.log('✅ Got resume data');
  
  // Get a job to analyze (AI Business Development)
  const jobId = '8344bbed-87cc-4a09-9037-5dbbc962a74d'; // AI BD role
  
  // Test analyze-with-tailoring
  console.log('🔄 Calling analyze-with-tailoring...');
  const analyzeResponse = await fetch('http://localhost:3000/api/jobs/analyze-with-tailoring', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      job_id: jobId,
      base_resume_data: resumeData,
      force_refresh: true
    })
  });
  
  const result = await analyzeResponse.json();
  
  console.log('\n📊 Analysis Results:');
  console.log('- Success:', result.success);
  console.log('- Strategy fit score:', result.strategy?.fit_score);
  console.log('- Atomic suggestions count:', result.atomic_suggestions?.length || 0);
  console.log('- Variant ID:', result.variant_id);
  
  if (result.atomic_suggestions?.length > 0) {
    console.log('\n📋 First suggestion:');
    console.log(JSON.stringify(result.atomic_suggestions[0], null, 2));
  }
  
  // Check if suggestions were saved to database
  if (result.variant_id) {
    const suggestionsResponse = await fetch(`http://localhost:3000/api/resume-variants/${result.variant_id}/suggestions`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (suggestionsResponse.ok) {
      const suggestions = await suggestionsResponse.json();
      console.log('\n💾 Suggestions in database:', suggestions.length);
    }
  }
}

testSuggestions().catch(console.error);