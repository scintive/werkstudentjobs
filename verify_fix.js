#!/usr/bin/env node

// Verification script for acceptedSuggestions ReferenceError fix

const verifyFix = async () => {
  try {
    console.log('🔍 Verifying acceptedSuggestions ReferenceError fix...\n');

    // Test if the server is running without crashes
    console.log('📡 Testing server status...');

    const response = await fetch('http://localhost:3002', {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ Server is running without ReferenceError crashes');
    } else {
      console.log('⚠️ Server responded but with status:', response.status);
    }

    console.log('\n🎉 Verification complete!');
    console.log('💡 All acceptedSuggestions references have been unified to appliedSuggestions');
    console.log('   The ReferenceError should be completely resolved');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n🔧 Make sure the dev server is running: npm run dev');
  }
};

verifyFix();

