/**
 * ai-config.ts
 * Configuration for Google Cloud Vertex AI
 */

import { VertexAI } from '@google-cloud/vertexai';

// Project configuration
export const PROJECT_ID = 'med-assist-9edf0';
export const LOCATION = 'us-central1';
export const MODEL_NAME = 'gemini-2.0-flash-001'; // Fast, efficient model
export const EMBEDDING_MODEL = 'text-embedding-004'; // For creating embeddings

// Initialize Vertex AI
export const vertexAi = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION
});

// Get the generative model (for answering questions)
export const generativeModel = vertexAi.preview.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.3, // Lower = more factual, less creative
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048
  }
});

// Test function to verify AI is working
export async function testAiConnection() {
  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say hello in one word' }] }]
    });
    return { 
      success: true, 
            response: result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
    };
  } catch (error) {
    console.error('AI Connection failed:', error);
    return { success: false, error: String(error) };
  }
}