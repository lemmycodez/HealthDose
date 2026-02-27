import { firebaseProjectId } from '../lib/firebase/config'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── RAG backend ──────────────────────────────────────────────────────────────

type RagSource = { title: string; drugName: string; excerpt: string; relevance: number }
type RagResponse = {
  success: boolean
  question: string
  answer: string
  sources?: RagSource[]
  error?: string
}

function getFunctionsBaseUrl() {
  const explicit = (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ?? ''
  if (explicit) return explicit.replace(/\/+$/, '')
  const projectId = firebaseProjectId || 'med-assist-9edf0'
  return `https://us-central1-${projectId}.cloudfunctions.net`
}

async function queryRag(question: string): Promise<RagResponse> {
  const baseUrl = getFunctionsBaseUrl()
  const res = await fetch(`${baseUrl}/askHealthDose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `RAG request failed (${res.status})`)
  }

  return (await res.json()) as RagResponse
}

function formatSources(sources: RagSource[] | undefined) {
  if (!sources || sources.length === 0) return ''
  const lines = sources.map(
    s => `- ${s.title}${s.drugName ? ` (${s.drugName})` : ''} [${s.relevance.toFixed(2)}]`
  )
  return `\n\nSources:\n${lines.join('\n')}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendToAI(messages: AIMessage[], _apiKey: string): Promise<string> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMessage) return 'Please ask a question.'

  const query = lastUserMessage.content

  try {
    const result = await queryRag(query)
    if (result?.answer) {
      return `${result.answer}${formatSources(result.sources)}`
    }
  } catch (error) {
    console.error('RAG query failed:', error)
  }

  return "I couldn't reach the HealthDose knowledge base right now. Please try again later."
}
