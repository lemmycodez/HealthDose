/**
 * ragQuery.ts
 * RAG query: semantic retrieval from Firestore + Gemini answer generation.
 */

import * as admin from 'firebase-admin'
import { GoogleAuth } from 'google-auth-library'

// Lazy initialization keeps Firebase module analysis stable during deploy.
let _db: FirebaseFirestore.Firestore | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _vertexAi: any = null
let _auth: GoogleAuth | null = null

function getDb(): FirebaseFirestore.Firestore {
  if (!_db) _db = admin.firestore()
  return _db
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVertexAi(): any {
  if (!_vertexAi) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { VertexAI } = require('@google-cloud/vertexai')
    _vertexAi = new VertexAI({ project: PROJECT_ID, location: LOCATION })
  }
  return _vertexAi
}

function getAuth(): GoogleAuth {
  if (!_auth) {
    _auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  }
  return _auth
}

interface ChunkResult {
  id: string
  text: string
  title: string
  drugName: string
  filename: string
  chunkIndex: number
  similarity: number
}

interface AnswerResult {
  answer: string
  sources: Array<{ title: string; drugName: string; excerpt: string; relevance: number }>
  numSources: number
}

interface RagQueryResult {
  success: boolean
  question: string
  answer: string
  sources: Array<{ title: string; drugName: string; excerpt: string; relevance: number }>
  processingTime?: number
  error?: string
}

const EMBEDDING_MODEL = 'text-embedding-004'
const GENERATION_MODEL = 'gemini-2.0-flash-001'
const MAX_CHUNKS = 5
const SIMILARITY_THRESHOLD = 0.5
const PROJECT_ID = 'med-assist-9edf0'
const LOCATION = 'us-central1'

async function generateQueryEmbedding(query: string): Promise<number[]> {
  console.log('   Generating embedding for query...')

  const client = await getAuth().getClient()
  const tokenResponse = await client.getAccessToken()
  const accessToken = tokenResponse.token
  if (!accessToken) {
    throw new Error('Failed to obtain access token for Vertex AI')
  }

  const url =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ content: query }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Vertex embedding error ${response.status}: ${errorText.slice(0, 300)}`)
  }

  const result = (await response.json()) as {
    predictions?: Array<{ embeddings?: { values?: number[] } }>
  }
  const embedding = result?.predictions?.[0]?.embeddings?.values
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('No embedding values returned by Vertex AI')
  }

  console.log(`   Embedding generated (${embedding.length} dimensions)`)
  return embedding
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0

  let dotProduct = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    magA += vecA[i] * vecA[i]
    magB += vecB[i] * vecB[i]
  }

  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)
  if (magA === 0 || magB === 0) return 0

  return dotProduct / (magA * magB)
}

async function findRelevantChunks(queryEmbedding: number[]): Promise<ChunkResult[]> {
  console.log('   Searching for relevant chunks...')

  const snapshot = await getDb().collection('medical_knowledge').get()
  console.log(`   Found ${snapshot.size} chunks in database`)

  const chunksWithScores: ChunkResult[] = []
  snapshot.forEach(doc => {
    const data = doc.data()
    if (!data.embedding || !Array.isArray(data.embedding)) return

    const similarity = cosineSimilarity(queryEmbedding, data.embedding)
    chunksWithScores.push({
      id: doc.id,
      text: data.text,
      title: data.title,
      drugName: data.drug_name,
      filename: data.filename,
      chunkIndex: data.chunk_index,
      similarity,
    })
  })

  chunksWithScores.sort((a, b) => b.similarity - a.similarity)
  const relevantChunks = chunksWithScores
    .filter(chunk => chunk.similarity >= SIMILARITY_THRESHOLD)
    .slice(0, MAX_CHUNKS)

  console.log(`   Relevant chunks found: ${relevantChunks.length}`)
  return relevantChunks
}

function buildContext(chunks: ChunkResult[]): string {
  let context =
    'You are a helpful medical information assistant. Answer questions based only on the excerpts below. ' +
    "If the answer is not in the excerpts, say you don't have enough information.\n\n"
  context += 'MEDICAL DOCUMENT EXCERPTS:\n'
  context += '='.repeat(50) + '\n\n'

  chunks.forEach((chunk, index) => {
    context += `[Source ${index + 1}: ${chunk.title}]\n`
    context += `${chunk.text}\n\n`
    context += '-'.repeat(40) + '\n\n'
  })

  context += 'Answer the user question using only those sources.'
  return context
}

async function generateAnswer(
  question: string,
  context: string,
  chunks: ChunkResult[]
): Promise<AnswerResult> {
  console.log('   Sending prompt to Gemini...')

  const generativeModel = getVertexAi().preview.getGenerativeModel({
    model: GENERATION_MODEL,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40,
    },
  })

  const prompt = `${context}\n\nQuestion: ${question}\n\nAnswer:`
  const result = await generativeModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  const answer =
    result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No answer generated'
  const sources = chunks.map(chunk => ({
    title: chunk.title,
    drugName: chunk.drugName,
    excerpt: `${chunk.text.substring(0, 200)}...`,
    relevance: chunk.similarity,
  }))

  return {
    answer,
    sources,
    numSources: sources.length,
  }
}

export async function ragQuery(question: string): Promise<RagQueryResult> {
  const startTime = Date.now()

  try {
    const queryEmbedding = await generateQueryEmbedding(question)
    const relevantChunks = await findRelevantChunks(queryEmbedding)

    if (relevantChunks.length === 0) {
      return {
        success: true,
        question,
        answer: "I couldn't find any relevant medical information to answer your question.",
        sources: [],
        processingTime: Date.now() - startTime,
      }
    }

    const context = buildContext(relevantChunks)
    const { answer, sources } = await generateAnswer(question, context, relevantChunks)

    return {
      success: true,
      question,
      answer,
      sources,
      processingTime: Date.now() - startTime,
    }
  } catch (error) {
    console.error('RAG query failed:', error)
    return {
      success: false,
      question,
      error: error instanceof Error ? error.message : 'Unknown error',
      answer: 'Sorry, I encountered an error processing your question.',
      sources: [],
    }
  }
}

export async function testRagQueries() {
  const testQuestions = [
    'What are the side effects of ibuprofen?',
    'Can I take ibuprofen with warfarin?',
    'How does amoxicillin work?',
    'What drugs interact with warfarin?',
    'What is the dosage for ibuprofen?',
  ]

  for (const question of testQuestions) {
    const result = await ragQuery(question)
    console.log(`Q: ${question}`)
    console.log(`A: ${result.answer.substring(0, 150)}...`)
    if (result.sources?.length) {
      console.log(`Sources: ${result.sources.map(s => s.drugName).join(', ')}`)
    }
    console.log('-'.repeat(50))
  }
}
