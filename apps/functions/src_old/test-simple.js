// test-simple.js
// Simple test that doesn't need TypeScript

async function runTest() {
  console.log('🤖 Testing Vertex AI connection...');
  console.log('=' .repeat(50));
  
  try {
    // Try to import the compiled JavaScript
    const { testAiConnection } = require('./lib/ai-config.js');
    
    const result = await testAiConnection();
    
    if (result.success) {
      console.log('✅ SUCCESS! AI is working!');
      console.log(`Response: ${result.response}`);
    } else {
      console.log('❌ FAILED:', result.error);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('=' .repeat(50));
}

runTest();