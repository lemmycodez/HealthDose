import { firebaseProjectId } from '../lib/firebase/config'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RagSource = { title: string; drugName: string; excerpt: string; relevance: number }

export type AIResponse = {
  text: string
  sources: RagSource[]
  answerSource: 'rag' | 'openFDA' | 'gemini' | 'error'
}

export type InteractionResult = {
  found: boolean
  hasInteraction: boolean
  highestSeverity?: string
  medications?: {
    a?: { name: string; drugClass?: string }
    b?: { name: string; drugClass?: string }
    requestedA?: string
    requestedB?: string
    foundA?: string | null
    foundB?: string | null
  }
  interactions?: Array<{
    id: string
    severity: string
    type: string
    description: string
    advice: string
  }>
  summary?: string
  message?: string
}

// ─── RAG backend ──────────────────────────────────────────────────────────────

type RagResponse = {
  success: boolean
  question: string
  answer: string
  sources?: RagSource[]
  answerSource?: 'rag' | 'openFDA' | 'gemini'
  error?: string
}

function getFunctionsBaseUrl() {
  const explicit = (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ?? ''
  if (explicit) return explicit.replace(/\/+$/, '')
  const projectId = firebaseProjectId || 'med-assist-9edf0'
  return `https://us-central1-${projectId}.cloudfunctions.net`
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function queryRag(question: string): Promise<RagResponse> {
  const baseUrl = getFunctionsBaseUrl()
  const url = `${baseUrl}/askHealthDose`
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }

  // Retry up to 3 times with increasing timeouts (handles cold starts)
  const timeouts = [15000, 25000, 35000]
  let lastError: Error = new Error('Request failed')

  for (let attempt = 0; attempt < timeouts.length; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeouts[attempt])
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `RAG request failed (${res.status})`)
      }
      return (await res.json()) as RagResponse
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Abort = timeout, fetch error = network — both worth retrying
      const retryable =
        lastError.name === 'AbortError' || lastError.message.toLowerCase().includes('fetch')
      if (!retryable || attempt === timeouts.length - 1) throw lastError
      // Brief pause before retry
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  throw lastError
}

// ─── Local greeting/courtesy handler ─────────────────────────────────────────

const GREETING_PATTERNS = [/^\s*(hi|hey|hello|howdy|hie|muli bwanji|muli shani|muzibuke|salamu)\b/i]
const THANKS_PATTERNS = [
  /^\s*(thanks?|thank you|cheers|much appreciated|appreciate it|zikomo|natotela|ndalumba)\b/i,
]
const HOW_ARE_YOU_PATTERNS = [/^\s*(how are you|how r u|how are u doing|what'?s up|wassup|sup)\b/i]
const CAPABILITY_PATTERNS = [
  /^\s*(what can you do|what do you do|help me|how can you help|what are you|who are you|tell me about yourself)\b/i,
]
const FAREWELL_PATTERNS = [/^\s*(bye|goodbye|see you|cya|see ya|later|good night|take care)\b/i]

function localGreetingResponse(text: string): string | null {
  if (GREETING_PATTERNS.some(p => p.test(text))) {
    return "Hello! I'm HealthDose AI, your pharmacology assistant. How can I help you today? You can ask me about medications, dosages, side effects, or drug interactions."
  }
  if (THANKS_PATTERNS.some(p => p.test(text))) {
    return "You're welcome! If you have any more questions about medications or health topics, feel free to ask anytime."
  }
  if (HOW_ARE_YOU_PATTERNS.some(p => p.test(text))) {
    return "I'm doing great, thank you for asking! I'm here and ready to help you with any pharmacology or medication questions. What would you like to know?"
  }
  if (CAPABILITY_PATTERNS.some(p => p.test(text))) {
    return "I'm HealthDose AI — a clinical pharmacology assistant. I can help you with:\n\n• Drug side effects and interactions\n• Medication dosages and administration\n• Mechanisms of action\n• Drug classifications\n• Contraindications and warnings\n\nJust type your question and I'll look it up from our medical knowledge base!"
  }
  if (FAREWELL_PATTERNS.some(p => p.test(text))) {
    return "Goodbye! Stay healthy, and don't hesitate to come back if you have any medication questions. Take care!"
  }
  return null
}

// ─── Zambian language support ─────────────────────────────────────────────────

export const ZAMBIAN_LANGUAGES = ['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi'] as const
export type ZambianLanguage = (typeof ZAMBIAN_LANGUAGES)[number]

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  Bemba: 'Please respond in Bemba (Chibemba) language. ',
  Nyanja: 'Please respond in Nyanja (Chichewa) language. ',
  Tonga: 'Please respond in Tonga (Chitonga) language. ',
  Lozi: 'Please respond in Lozi (Silozi) language. ',
  English: '',
}

// ─── Public API ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendToAI(
  messages: AIMessage[],
  _apiKey: string,
  language: ZambianLanguage = 'English'
): Promise<AIResponse> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMessage) {
    return { text: 'Please ask a question.', sources: [], answerSource: 'error' }
  }

  // ── Handle greetings and common courtesy locally (no backend call) ──────────
  const localReply = localGreetingResponse(lastUserMessage.content.trim())
  if (localReply) {
    return { text: localReply, sources: [], answerSource: 'gemini' }
  }

  let query = lastUserMessage.content
  const langInstruction = LANGUAGE_INSTRUCTIONS[language] ?? ''
  if (langInstruction) {
    query = `${langInstruction}${query}`
  }

  try {
    const result = await queryRag(query)
    if (result?.answer) {
      return {
        text: result.answer,
        sources: result.sources ?? [],
        answerSource: result.answerSource ?? 'gemini',
      }
    }
  } catch (error) {
    console.error('RAG query failed:', error)
    return {
      text: "I'm having trouble reaching the knowledge base right now. Please try sending your message again.",
      sources: [],
      answerSource: 'error',
    }
  }

  return {
    text: 'I received an empty response from the knowledge base. Please try rephrasing your question.',
    sources: [],
    answerSource: 'error',
  }
}

// ─── Drug Interaction API ─────────────────────────────────────────────────────

export async function checkDrugInteractionAPI(
  drugA: string,
  drugB: string
): Promise<InteractionResult> {
  const baseUrl = getFunctionsBaseUrl()
  const url = `${baseUrl}/checkDrugInteraction`
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drugA, drugB }),
  }

  const timeouts = [15000, 25000, 35000]
  let lastError: Error = new Error('Request failed')

  for (let attempt = 0; attempt < timeouts.length; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeouts[attempt])
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Drug interaction check failed (${res.status})`)
      }
      return (await res.json()) as InteractionResult
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const retryable =
        lastError.name === 'AbortError' || lastError.message.toLowerCase().includes('fetch')
      if (!retryable || attempt === timeouts.length - 1) throw lastError
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  throw lastError
}
