/**
 * test-embedding.js
 * Minimal test for embedding generation
 */

const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = 'med-assist-9edf0';
const LOCATION = 'us-central1';

async function testEmbedding() {
  console.log('🔬 Testing embedding generation...');
  
  const vertexAi = new VertexAI({
    project: PROJECT_ID,
    location: LOCATION
  });
  
  try {
    // Try the simple generateContent approach
    const model = vertexAi.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-001'
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }]
    });
    
    console.log('✅ Model works! Response:', result.response.candidates[0].content.parts[0].text);
    return true;
  } catch (err) {
    console.error('❌ Error:', err);
    return false;
  }
}

testEmbedding().then(success => {
  if (success) {
    console.log('\n🎉 Vertex AI is working!');
  } else {
    console.log('\n❌ There was an error');
  }
});