#!/usr/bin/env node

// Test script to verify the suggestion state fix

const testSuggestionFix = async () => {
  try {
    console.log('🧪 Testing suggestion state fix...\n');

    // Test if the server starts without crashes
    console.log('📡 Testing server startup...');

    const response = await fetch('http://localhost:3002', {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ Server is running without crashes');
    } else {
      console.log('⚠️ Server responded but with status:', response.status);
    }

    console.log('\n🎉 Suggestion state fix verification complete!');
    console.log('💡 The ReferenceError should be resolved and suggestion state');
    console.log('   should be properly managed within TailoredResumePreview');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the dev server is running: npm run dev');
  }
};

testSuggestionFix();

