/**
 * ragQuery.ts
 * RAG Query Function - Semantic search + Gemini generation
 */

import * as admin from 'firebase-admin';

// Lazy-initialized clients - @google-cloud/vertexai is required lazily via require()
// to prevent its background timers from blocking the Firebase CLI's module analysis.
let _db: FirebaseFirestore.Firestore | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _vertexAi: any = null;

function getDb(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore();
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVertexAi(): any {
  if (!_vertexAi) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { VertexAI } = require('@google-cloud/vertexai');
    _vertexAi = new VertexAI({ project: 'med-assist-9edf0', location: 'us-central1' });
  }
  return _vertexAi;
}

// Interfaces
interface ChunkResult {
  id: string;
  text: string;
  title: string;
  drugName: string;
  filename: string;
  chunkIndex: number;
  similarity: number;
}

interface AnswerResult {
  answer: string;
  sources: Array<{ title: string; drugName: string; excerpt: string; relevance: number }>;
  numSources: number;
}

interface RagQueryResult {
  success: boolean;
  question: string;
  answer: string;
  sources: Array<{ title: string; drugName: string; excerpt: string; relevance: number }>;
  processingTime?: number;
  error?: string;
}

// Configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const GENERATION_MODEL = 'gemini-2.0-flash-001';
const MAX_CHUNKS = 5;
const SIMILARITY_THRESHOLD = 0.5;

/**
 * Generate embedding for a query using Vertex AI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  console.log(`   🔑 Generating embedding for query...`);
  
  try {
    // Get the embedding model
    const embeddingModel = getVertexAi().preview.getGenerativeModel({
      model: EMBEDDING_MODEL
    });
    
    // Generate embedding
    const result = await embeddingModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }]
    });
    
    // Extract embedding from response
    const embedding = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!embedding) {
      throw new Error('No embedding generated');
    }
    
    // Parse embedding (it comes as a string of numbers)
    const embeddingArray = JSON.parse(embedding);
    
    console.log(`   ✅ Embedding generated (${embeddingArray.length} dimensions)`);
    return embeddingArray;
  } catch (error) {
    console.error('   ❌ Failed to generate query embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  if (magA === 0 || magB === 0) {
    return 0;
  }
  
  return dotProduct / (magA * magB);
}

/**
 * Find relevant chunks by comparing embeddings
 */
async function findRelevantChunks(queryEmbedding: number[]): Promise<ChunkResult[]> {
  console.log(`   🔍 Searching for relevant chunks...`);
  
  try {
    // Get all chunks from Firestore
    const snapshot = await getDb().collection('medical_knowledge').get();
    
    console.log(`   📚 Found ${snapshot.size} chunks in database`);
    
    const chunksWithScores: ChunkResult[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Skip if no embedding
      if (!data.embedding || !Array.isArray(data.embedding)) {
        return;
      }
      
      // Calculate similarity
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      
      chunksWithScores.push({
        id: doc.id,
        text: data.text,
        title: data.title,
        drugName: data.drug_name,
        filename: data.filename,
        chunkIndex: data.chunk_index,
        similarity: similarity
      });
    });
    
    // Sort by similarity (highest first)
    chunksWithScores.sort((a, b) => b.similarity - a.similarity);
    
    // Filter by threshold and take top MAX_CHUNKS
    const relevantChunks = chunksWithScores
      .filter(chunk => chunk.similarity >= SIMILARITY_THRESHOLD)
      .slice(0, MAX_CHUNKS);
    
    console.log(`   ✅ Found ${relevantChunks.length} relevant chunks above threshold`);
    
    // Log similarity scores
    relevantChunks.forEach((chunk, i) => {
      console.log(`      ${i+1}. ${chunk.drugName} (similarity: ${chunk.similarity.toFixed(3)})`);
    });
    
    return relevantChunks;
  } catch (error) {
    console.error('   ❌ Error searching chunks:', error);
    return [];
  }
}

/**
 * Build context from relevant chunks
 */
function buildContext(chunks: ChunkResult[]): string {
  let context = "You are a helpful medical information assistant. Answer questions based ONLY on the following medical document excerpts. If the answer cannot be found in the excerpts, say 'I don't have enough information to answer that question.' Always include relevant sources.\n\n";
  
  context += "MEDICAL DOCUMENT EXCERPTS:\n";
  context += "=".repeat(50) + "\n\n";
  
  chunks.forEach((chunk, index) => {
    context += `[Source ${index + 1}: ${chunk.title}]\n`;
    context += `${chunk.text}\n\n`;
    context += "-".repeat(40) + "\n\n";
  });
  
  context += "Based on the medical document excerpts above, please answer the following question.";
  
  return context;
}

/**
 * Generate answer using Gemini
 */
async function generateAnswer(question: string, context: string, chunks: ChunkResult[]): Promise<AnswerResult> {
  console.log(`   🤖 Sending to Gemini...`);
  
  try {
    const generativeModel = getVertexAi().preview.getGenerativeModel({
      model: GENERATION_MODEL,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    });
    
    const prompt = `${context}\n\nQuestion: ${question}\n\nAnswer:`;
    
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const answer = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated';
    
    console.log(`   ✅ Answer generated (${answer.length} characters)`);
    
    // Format sources for response
    const sources = chunks.map(chunk => ({
      title: chunk.title,
      drugName: chunk.drugName,
      excerpt: chunk.text.substring(0, 200) + '...',
      relevance: chunk.similarity
    }));
    
    return {
      answer,
      sources,
      numSources: sources.length
    };
  } catch (error) {
    console.error('   ❌ Gemini generation failed:', error);
    throw error;
  }
}

/**
 * Main RAG query function
 */
export async function ragQuery(question: string): Promise<RagQueryResult> {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 RAG QUERY');
  console.log('='.repeat(70));
  console.log(`📝 Question: "${question}"`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Generate embedding for the question
    const queryEmbedding = await generateQueryEmbedding(question);
    
    // Step 2: Find relevant chunks
    const relevantChunks = await findRelevantChunks(queryEmbedding);
    
    if (relevantChunks.length === 0) {
      console.log('⚠️ No relevant chunks found');
      return {
        success: true,
        question,
        answer: "I couldn't find any relevant medical information to answer your question.",
        sources: [],
        processingTime: Date.now() - startTime
      };
    }
    
    // Step 3: Build context
    const context = buildContext(relevantChunks);
    
    // Step 4: Generate answer
    const { answer, sources } = await generateAnswer(question, context, relevantChunks);
    
    const processingTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ RAG QUERY COMPLETE');
    console.log('='.repeat(70));
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📚 Sources used: ${sources.length}`);
    
    return {
      success: true,
      question,
      answer,
      sources,
      processingTime
    };
    
  } catch (error) {
    console.error('❌ RAG query failed:', error);
    return {
      success: false,
      question,
      error: error instanceof Error ? error.message : 'Unknown error',
      answer: 'Sorry, I encountered an error processing your question.',
      sources: []
    };
  }
}

/**
 * Test function for local testing
 */
export async function testRagQueries() {
  const testQuestions = [
    "What are the side effects of ibuprofen?",
    "Can I take ibuprofen with warfarin?",
    "How does amoxicillin work?",
    "What drugs interact with warfarin?",
    "What is the dosage for ibuprofen?"
  ];
  
  console.log('\n🧪 TESTING RAG QUERIES');
  console.log('='.repeat(70));
  
  for (const question of testQuestions) {
    const result = await ragQuery(question);
    console.log('\n📋 RESULT:');
    console.log(`Q: ${question}`);
    console.log(`A: ${result.answer.substring(0, 150)}...`);
    if (result.sources?.length > 0) {
      const sourceNames = result.sources.map((s) => s.drugName).join(', ');
      console.log(`Sources: ${sourceNames}`);
    }
    console.log('-'.repeat(50));
  }
  
  console.log('\n✅ Test complete!');
}